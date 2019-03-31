let fs               = require("fs");
let es_db            = require("../../_utils/es_db.js");
let progress         = require("./_cache/image_uploader_progress.json");
let upload_utils = require("../../_utils/upload_utils.js");

let product_types =  fs.readdirSync(`${__dirname}/save_transformers`);
let field_name = "image_crawler_version";
let collection_name = "product";
let cache_collection = "product_image";
let crawler_version = 7;

let upload = async(product_type, crawler_db) => {
    let limit = 10;
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
                        "term" : {"all_categories" : product_type}
                    }
                ]
            }
        },
        "_source" : ["images", "supplier", "distributor"]
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
            let images = product.images;
            let document = {
                ...crawler_version ? {[field_name] : crawler_version} : ""
            };

            if (images && images.length)
            {
                let hash_product = ready_products_hash[product._id];


                if (!hash_product)
                {
                    let supplier = product.supplier[0];
                    let distributor = product.distributor[0];

                    document.images = await single_product_upload({images, supplier, distributor, _id: product._id, crawler_version});
                    mongo_bulk.push({"command_name": "upsert", "_id": product._id, "document": {images: document.images}})
                }
                else
                {
                    document.images = hash_product.images
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
    fs.writeFileSync(__dirname + "/_cache/image_uploader_progress.json", JSON.stringify(progress), "utf8");
};

let single_product_upload = async({images, supplier, distributor, _id, options}) => {

    if (images && images.length)
    {
        for (let i = 0; i < images.length; i++)
        {
            let file_data = images[i];
            let new_item_names = await upload_utils.upload_product_image({
                file_data,
                path: `image/${distributor}/${supplier}`,
                product_id: _id,
                image_index: i,
                meta: {supplier: supplier, distributor: distributor},
                options
            }
            );
            new_item_names.link_id ? images[i].link = new_item_names.link_id : null;
            new_item_names.thumb_link_id ? images[i].thumb_link = new_item_names.thumb_link_id : null
        }
        console.log(`Uploaded ${images.length} images: ${supplier}`)
    }

    return images
};

let run = async (crawler_db) => {

    await es_db.init();
    crawler_db = crawler_db || await init_crawler_db();

    for (let i = 0; i < product_types.length; i++)
    {
        let product_type = product_types[i];

        if (progress[product_type])
            continue;
        await upload(product_type, crawler_db)
    }
};

let init_crawler_db = async() =>{
    let MongoDb = require("../../_utils/db.js");

    let crawler_db = new MongoDb();
    await crawler_db.init({host: "172.16.1.11", database: "crawlers", user: "hashstyle", "pass": "Ha5h5tylE"});
    return crawler_db
};

let upload_single = async (es_oid) => {

    let crawler_db = await init_crawler_db();
    await es_db.init();

    let es_product = await es_db.read_one(collection_name, {"body" : {"query" : {"term" : {"oid" : es_oid}}}});

    if (!es_product)
        return console.error("Product not found");

    let images = es_product.distributor_only.images;

    if (!images  || !images.length)
        return console.error("No images");

    let supplier = es_product.supplier[0];
    let distributor = es_product.distributor[0];
    let document = {
        _id : es_product._id,
        images: await single_product_upload({images, supplier, distributor, _id: es_product._id, options: {force: true}})
    };

    await es_db.update(collection_name, {data : document});
    await crawler_db.update(cache_collection, {data : document})
};

module.exports = {
    run
};

let r  = () => {
   run()
   .then(() => process.exit(0))
   .catch(e => { console.error(e); r() })
};

process.on('uncaughtException', function (err, data) {
    console.error("--- UNCAUGHT EXCEPTION ---", err);
    r()
});

r();

// upload_single("B3D1020-E")
// .then(() => process.exit(0))
// .catch(e => console.error(e));
