let fs = require("fs");
let directory_reader = require("../../_utils/directory_reader.js");
let utils = require("../../_utils/utils.js");
let es_db = require("../../_utils/es_db.js");

let himedia_pdf_crawler = require("./match_himedia_pdfs/himedia_pdf_crawler.js");
let product_data_collector = require("./match_himedia_pdfs/product_data_collector.js");
let pdf_text_extractor = require("./match_himedia_pdfs/pdf_text_extractor.js");
let text_finder = require("./match_himedia_pdfs/small_petko.js");

let download_dir = `${__dirname}/match_himedia_pdfs/_download`;


let find_id_matches = async (domain) => {

    let hash_path = __dirname + "/pdf_hash.json";
    let pdf_hash = {};

    if (fs.existsSync(hash_path))
        pdf_hash = JSON.parse(fs.readFileSync(hash_path, "utf8"));

    let pdfs = directory_reader(`${download_dir}/`, "pdf", {denyFilesList: ["himedia_catalogue_2018_all.pdf"]}, () => "");
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
            let pdfs = (product.pdf || []).filter(item => item.link.indexOf("himedia_catalogue_2018_") !== 0);
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
        let limit = 1000;
        let page = 0;
        let start_index = page * limit;
        let end_index = page * limit + limit;

        utils.objEach(product_pdf_map, (key, value) => {
            let pdf = utils.uniq(value, item => item.link);
            es_bulk.push({"model_title": "product", "command_name": "update", "_id": key, "document": {pdf: pdf}});
        });

        do {
            start_index = page * limit;
            end_index = page * limit + limit;
            let bulk_data = es_bulk.slice(start_index, end_index);

            if (bulk_data.length)
                await es_db.bulk(bulk_data);

            page++;
            console.log("Saving data", page * limit, "/", es_bulk.length)
        }
        while(end_index < es_bulk.length);
    };

    await es_db.init();

    let oids = Object.keys(pdf_hash);
    let product_hash = await read_products(oids);
    let product_pdf_map = build_product_pdf_map(product_hash, pdf_thumbs);

    await save_product_changes(product_pdf_map)
};

let run = async() =>
{
    await himedia_pdf_crawler.run({url : "http://www.himedialabs.com/Catalogue/2018/files/assets/common/downloads/page{0}.pdf", file_prefix: "himedia_catalogue_2018_", page_count: 616, download_dir: download_dir});
    let pdf_thumbs = await himedia_pdf_crawler.upload(download_dir, "ridacom_ltd","himedia_laboratories");

    let domain_hash = await product_data_collector.run();
    init_text_finder(domain_hash);

    let pdf_hash = await find_id_matches("himedia_laboratories");

    await update_pdf_links(pdf_hash, pdf_thumbs)
};


run()
.then(() => process.exit(0))
.catch(e => console.error(e));