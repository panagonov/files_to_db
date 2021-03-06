let fs           = require("fs");
let utils        = require("../../_utils/utils.js");
let es_db        = require("@bioseek/core/db/elasticsearch/db.js");
let progress     = require("./_cache/pdf_uploader_progress.json");
let upload_utils = require("../../_utils/upload_pdf_utils.js");

let product_types =  fs.readdirSync(`${__dirname}/save_transformers`);
let field_name = "pdf_crawler_version";
let collection_name = "product";
let cache_collection = "product_pdf";
let crawler_version = 2;

product_type_mapping = {
    "antibody" : "antibodies",
    "elisa_kit" : "elisa_kits",
};

/**
 *
 * @param product_type
 * @param crawler_db
 * @param {Object} options
 * @param {Boolean} options.force - re-craw all images
 * @param {Boolean} options.check_uploaded
 * @returns {Promise<void>}
 */
let upload = async(product_type, crawler_db, options = {}) => {
    let limit = options.force ? 1 : 10;
    let page = 0;
    let result = [];

    let body = {
        "query" : {
            "bool" : {
                "must_not": {
                    "term" : {[field_name] : crawler_version}
                },
                "must" : [
                    {
                        "term" : {"supplier" : "himedia_laboratories"}
                    }
                ]
            }
        },
        "_source" : ["pdf", "supplier", "distributor", "distributor_only"]
    };

    do {
        let db_data = await es_db.read_unlimited(collection_name, {body: body, size : limit});
        result = db_data.data;

        let ids = result.map(item => item._id);
        let already_downloaded = await crawler_db.read(cache_collection, {body: {"_id" : {$in: ids}}});
        let ready_products_hash = already_downloaded.reduce((res, item) => {
            res[item._id] = item;
            return result;
        }, {});

        let es_bulk = [];
        let mongo_bulk = [];

        for (let i = 0; i < result.length; i++)
        {
            let product = result[i];
            let pdf = options.force ? product.distributor_only.pdf : product.pdf;
            let document = {
                ...crawler_version ? {[field_name] : crawler_version} : ""
            };

            if (pdf && pdf.length)
            {
                let hash_product = ready_products_hash[product._id];


                if (!hash_product || !hash_product.pdf || options.force || options.check_uploaded)
                {
                    let supplier = product.supplier[0];
                    let distributor = product.distributor[0];

                    document.pdf = await single_product_upload({
                        items: pdf,
                        originals : product.distributor_only.pdf,
                        supplier,
                        distributor,
                        _id: product._id,
                        options: options
                    });
                    mongo_bulk.push({"command_name": "upsert", "_id": product._id, "document": {pdf: document.pdf}})
                }
                else
                {
                    document.pdf = hash_product.pdf
                }
            }

            es_bulk.push({"model_title": collection_name, "command_name": "update", "_id": product._id, "document": document});
            console.log(`Ready - ${i+1}/${limit} products`)
        }

        if (es_bulk.length)
            await es_db.bulk(es_bulk);

        if (mongo_bulk.length)
            await crawler_db.bulk(cache_collection, mongo_bulk);

        page++;
        console.log(product_type, `${page * limit}/${db_data.count}`)
    }
    while(result.length === limit);

    progress[product_type] = 1;
    fs.writeFileSync(__dirname + "/_cache/pdf_uploader_progress.json", JSON.stringify(progress), "utf8");
};

let single_product_upload = async({items, originals, supplier, distributor, _id, options}) => {

    for (let i = 0; i < (items || []).length; i++)
    {
        let file_data = items[i];
        let need_do_download = (file_data.link && file_data.link.indexOf("http") === 0) || file_data.file_content;

        if(!need_do_download && options.check_uploaded)
        {
            if (!(await upload_utils.s3_check_is_file_exists(`pdf/${distributor}/${supplier}`, file_data.link)))
            {
                console.error(`image/${distributor}/${supplier}/${file_data.link} is missing`);
                console.error(_id);
                items[i] = originals[i];
                file_data = items[i];
                need_do_download = true;
            }
        }

        if (need_do_download)
        {
            let file_name = (file_data.link || file_data.href).split("/");
            file_name = file_name.slice(3, file_name.length).join("_");
            let new_item_names = await upload_utils.upload_product_pdf({
                ...file_data.link ? {link: file_data.link} : "",
                ...file_data.file_content ? {file_content: file_data.file_content} : "",
                path: `pdf/${distributor}/${supplier}`,
                file_name: file_name,
                meta: {supplier: supplier, distributor: distributor},
                options
            });
            new_item_names.link_id ? items[i].link = new_item_names.link_id : null;
            new_item_names.thumb_link_id ? items[i].thumb_link = new_item_names.thumb_link_id : null;
            items[i].file_content ? delete items[i].file_content : ""
        }
    }
    console.log(`Uploaded ${(items || []).length} pdfs: ${supplier}`);

    return items
};

let run = async (crawler_db, options) => {

    await es_db.init();
    crawler_db = crawler_db || await init_crawler_db();

    for (let i = 0; i < product_types.length; i++)
    {
        let product_type = product_types[i];

        if (progress[product_type])
            continue;
        await upload(product_type_mapping[product_type] || product_type, crawler_db, options)
    }
};

let init_crawler_db = async() =>{
    let MongoDb = require("../../_utils/db.js");

    let crawler_db = new MongoDb();
    await crawler_db.init({host: "172.16.1.11", database: "crawlers", user: "hashstyle", "pass": "Ha5h5tylE"});
    return crawler_db
};

let upload_single = async (es_oid, options) => {

    let crawler_db = await init_crawler_db();
    await es_db.init();

    let es_product = await es_db.read_one(collection_name, {"body" : {"query" : {"term" : {"oid" : es_oid}}}});

    if (!es_product)
        return console.error("Product not found");

    let items = es_product.distributor_only.pdf;

    if (!items  || !items.length)
        return console.error("No pdfs");

    let supplier = es_product.supplier[0];
    let distributor = es_product.distributor[0];
    let ready_items =  await single_product_upload({items, supplier, distributor, _id: es_product._id, options: options});

    let final_pdfs = utils.uniq(ready_items.concat(es_product.pdf).filter(item => item.link.indexOf("http") !== 0), item => item.link);
    await es_db.update(collection_name, {data : {_id : es_product._id, pdf: final_pdfs}});
    console.log(es_product._id);
    console.log(ready_items);
    await crawler_db.create(cache_collection, {data : {_id : es_product._id, pdf: final_pdfs}})
};

module.exports = {
    run
};

let r  = (oid, options) => {
    if (oid) {
        upload_single(oid, options)
        .then(() => process.exit(0))
        .catch(e => console.error(e));
    }
    else
    {
        run("", options)
        .then(() => process.exit(0))
        .catch(e => { console.error(e); r() })
    }
};

process.on('uncaughtException', function (err, data) {
    console.error("--- UNCAUGHT EXCEPTION ---", err);
    r()
});

r("" , {/*check_uploaded: true, */force: true});