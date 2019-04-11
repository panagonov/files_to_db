let fs               = require("fs");
let directory_reader = require("../../_utils/directory_reader.js");
let utils            = require("../../_utils/utils.js");
let es_db            = require("../../_utils/es_db.js");
let MongoDb          = require("../../_utils/db.js");

let pdf_crawler            = require("./match_pdf_to_product/pdf_crawler.js");
let product_data_collector = require("./match_pdf_to_product/product_data_collector.js");
let pdf_text_extractor     = require("./match_pdf_to_product/pdf_text_extractor.js");
let text_finder            = require("./match_pdf_to_product/small_petko.js");

let find_id_matches = async (domain, download_dir, deny_file_list) => {

    let hash_path = download_dir + "/pdf_hash.json";
    let pdf_hash = {};

    if (fs.existsSync(hash_path))
        pdf_hash = JSON.parse(fs.readFileSync(hash_path, "utf8"));

    let pdfs = directory_reader(`${download_dir}/`, "pdf", {denyFilesList: deny_file_list}, () => "");
    let count = Object.keys(pdfs).length;
    let page = 0;

    for (let key in pdfs)
    {
        let file_path = `${download_dir}/${key}`;
        if (fs.existsSync(file_path + ".txt"))
            continue;

        let text = await pdf_text_extractor.run(file_path);
        let matches = text_finder.run(text, domain);

        matches = utils.uniq(matches.result, item => item.originalText);

        if (matches && matches.length){
            matches.forEach(({originalText}) =>
            {
                pdf_hash[originalText] = pdf_hash[originalText] || [];
                pdf_hash[originalText].push(key);
            });
        }

        page++;
        console.log(`${key} found ${matches.length} - ${page}/${count}`);
    }

    fs.writeFileSync(hash_path, JSON.stringify(pdf_hash), "utf8");

    return pdf_hash;
};

let init_text_finder = (domain_hash) => {
    utils.objEach(domain_hash, (key, value) => {
        text_finder.add_domain(key, value)
    })
};

let update_pdf_links = async (pdf_hash, pdf_thumbs) => {

    let read_products = async(oids) =>
    {
        let limit = 800;
        let page = 0;
        let start_index = page * limit;
        let end_index = page * limit + limit;
        let product_hash = {};

        do {
            start_index = page * limit;
            end_index = page * limit + limit;
            let ids = oids.slice(start_index, end_index);

            let products = await es_db.read_unlimited("product", {"body" : {
                "query" : {
                    "bool" : {
                        "should" : [
                            {"terms" : {"oid" : ids}},
                            {"terms" : {"price_model.variation.product_id" : ids}}
                        ]
                    }
                },
                "_source" : ["oid", "price_model.variation", "pdf"]
            }, size: limit});

            products.data.forEach(product => {
                product_hash[product.oid] = product;
                if (product.price_model && product.price_model.variation)
                {
                    product.price_model.variation.forEach(item =>{
                        if (item.product_id)
                            product_hash[item.product_id] = product;
                    })
                }
            });

            page++;
            console.log("Read products", page * limit, "/", oids.length)
        }
        while(end_index < oids.length);

        return product_hash
    };

    let build_product_pdf_map = (product_hash, pdf_thumbs) =>
    {
        let product_pdf_map = {};

        utils.objEach(product_hash, (key, product) => {
            let pdfs = product.pdf || [];
            let catalogue_pdfs = (pdf_hash[key] || []).map(file_name => ({
                link: file_name + ".pdf",
                ...pdf_thumbs[file_name + ".pdf"] ? {thumb_link: pdf_thumbs[file_name + ".pdf"]} : "",
                type: "Catalogue Page"
            }));

            product_pdf_map[product._id] =  product_pdf_map[product._id] ||[];
            product_pdf_map[product._id] = product_pdf_map[product._id].concat(pdfs, catalogue_pdfs)
        });

        return product_pdf_map;
    };

    let save_product_changes = async(product_pdf_map) => {
        let es_bulk = [];
        let mongo_bulk = [];
        let limit = 1000;
        let page = 0;
        let start_index = page * limit;
        let end_index = page * limit + limit;

        utils.objEach(product_pdf_map, (key, value) => {
            let pdf = utils.uniq(value, item => item.link);
            es_bulk.push({"model_title": "product", "command_name": "update", "_id": key, "document": {pdf: pdf}});
            mongo_bulk.push({"command_name": "upsert", "_id": key, "document": {pdf: pdf}});
        });

        do {
            start_index = page * limit;
            end_index = page * limit + limit;
            let bulk_data = es_bulk.slice(start_index, end_index);
            let mongo_bulk_data = mongo_bulk.slice(start_index, end_index);

            if (bulk_data.length)
                await es_db.bulk(bulk_data);

            if (mongo_bulk_data.length)
                await crawler_db.bulk("product_pdf", mongo_bulk_data);

            page++;
            console.log("Saving data", page * limit, "/", es_bulk.length)
        }
        while(end_index < es_bulk.length);
    };

    await es_db.init();
    let crawler_db = new MongoDb();
    await crawler_db.init({host: "172.16.1.11", database: "crawlers", user: "hashstyle", "pass": "Ha5h5tylE"});

    let oids = Object.keys(pdf_hash);
    let product_hash = await read_products(oids);
    let product_pdf_map = build_product_pdf_map(product_hash, pdf_thumbs);

    await save_product_changes(product_pdf_map)
};

let run = async({distributor, supplier, deny_file_list, crawler_settings = {}}) =>
{
    let download_dir = `${__dirname}/files/${supplier}`;

    if (pdf_crawler[supplier + "_download"])
    {
        crawler_settings.download_dir = download_dir;
        await pdf_crawler[supplier + "_download"](crawler_settings);
    }

    let pdf_thumbs = await pdf_crawler.upload(download_dir, distributor, supplier);

    let domain_hash = await product_data_collector.run(download_dir);
    init_text_finder(domain_hash);

    let pdf_hash = await find_id_matches(supplier, download_dir, deny_file_list);

    await update_pdf_links(pdf_hash, pdf_thumbs)
};


let settings = {
    "himedia_laboratories" : {
        distributor: "ridacom_ltd",
        supplier: "himedia_laboratories",
        deny_file_list: ["himedia_catalogue_2018_all.pdf"],
        crawler_settings: {
            url : "http://www.himedialabs.com/Catalogue/2018/files/assets/common/downloads/page{0}.pdf",
            file_prefix : "himedia_catalogue_2018_",
            page_count: 616
        }
    },
    "capp": {
        distributor: "ridacom_ltd",
        supplier: "capp",
    }
};

run(settings.himedia_laboratories)
.then(() => process.exit(0))
.catch(e => console.error(e));



// let petko_test = async(supplier, file_name) => {
//     let text = fs.readFileSync(`${__dirname}/files/${supplier}/${file_name}`, "utf8");
//     let domain_hash = require(`./files/${supplier}/id_hash.json`);
//     init_text_finder(domain_hash)
//     let matches = text_finder.run(text, supplier);
//     debugger
// }
// petko_test("himedia_laboratories", "test.txt")
// .then(() => process.exit(0))
// .catch(e => console.error(e));