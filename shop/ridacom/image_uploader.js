let fs               = require("fs");
let es_db            = require("../../_utils/es_db.js");
let progress         = require("./_cache/image_uploader_progress.json");
let upload_utils = require("../../_utils/upload_utils.js");

let product_types =  fs.readdirSync(`${__dirname}/save_transformers`);
let field_name = "image_crawler_version";
let collection_name = "product";
let crawler_version = 2;

let upload = async(product_type) => {
    let limit = 1;
    let page = 0;
    let result = [];

    let body = {
        "query" : {
            "bool" : {
                "must_not": {
                    "term" : {[field_name] : crawler_version}
                },
                "must" : {
                    "term" : {"all_categories" : product_type}
                }
            }
        },
        "_source" : ["images", "supplier", "distributor"]
    };

    do {
        let db_data = await es_db.read_unlimited(collection_name, {body: body, size : limit});
        result = db_data.data;
        let es_bulk = [];

        for (let i = 0; i < result.length; i++)
        {
            let product = result[i];
            let images = product.images;
            let supplier = product.supplier[0];
            let distributor = product.distributor[0];

            let document = await single_product_upload({images, supplier, distributor, _id: product._id, crawler_version});

            es_bulk.push({"model_title": collection_name, "command_name": "update", "_id": product._id, "document": document});
        }

        if (es_bulk.length)
            await es_db.bulk(es_bulk);

        page++;
        console.log(product_type, `${page * limit}/${db_data.count}`)
    }
    while(result.length === limit);

    progress[product_type] = 1;
    fs.writeFileSync(__dirname + "/_cache/image_uploader_progress.json", JSON.stringify(progress), "utf8");
};

let single_product_upload = async({images, supplier, distributor, _id, crawler_version}) => {
    let document = {
        ...crawler_version ? {[field_name] : crawler_version} : ""
    };

    if (images && images.length)
    {
        for (let i = 0; i < images.length; i++)
        {
            let file_data = images[i];
            let new_image_names = await upload_utils.upload_product_image({
                file_data,
                path: `image/${distributor}/${supplier}`,
                product_id: _id,
                image_index: i,
                meta: {supplier: supplier, distributor: distributor}}
            );
            new_image_names.link_id ? file_data.link = new_image_names.link_id : null;
            new_image_names.thumb_link_id ? file_data.thumb_link = new_image_names.thumb_link_id : null
        }
        document.images = images;
        console.log(`Uploaded ${images.length} images: ${supplier}`)
    }

    return document
};



let run = async () => {
    await es_db.init();

    for (let i = 0; i < product_types.length; i++)
    {
        let product_type = product_types[i];

        if (progress[product_type])
            continue;
        await upload(product_type)
    }
};

let upload_single = async (oid) => {
    let MongoDb = require("../../_utils/db.js");

    let crawler_db = new MongoDb();
    await crawler_db.init({host: "172.16.1.11", database: "crawlers", user: "hashstyle", "pass": "Ha5h5tylE"});

    await es_db.init();

    let product = await crawler_db.read_one(collection_name, {"body" : {"oid" : oid}});
    let es_product = await es_db.read_one(collection_name, {"body" : {"query" : {"term" : {"oid" : oid}}}});

    let images = es_product.images.map((item, index) => {
        item.link = product.images[index].link || product.images[index].href;
        return item
    });
    let supplier = es_product.supplier[0];
    let distributor = es_product.distributor[0];
    let document = await single_product_upload({images, supplier, distributor, _id: es_product._id});

    document._id = es_product._id;
    await es_db.update(collection_name, {data : document})
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

// upload_single("SAB 514i")
// .then(() => process.exit(0))
// .catch(e => console.error(e));
