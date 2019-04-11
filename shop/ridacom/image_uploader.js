let fs           = require("fs");
let es_db        = require("../../_utils/es_db.js");
let progress     = require("./_cache/image_uploader_progress.json");
let upload_utils = require("../../_utils/upload_utils.js");

let product_types =  fs.readdirSync(`${__dirname}/save_transformers`);
let field_name = "image_crawler_version";
let collection_name = "product";
let cache_collection = "product_image";
let crawler_version = 32;

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
                        "term" : {"all_categories" : product_type}
                    },
                    {
                        "term" : {"supplier" : "adam_equipment"}
                    }
                ]
            }
        },
        "_source" : ["images", "supplier", "distributor", "distributor_only"]
    };

    do {
        let db_data = await es_db.read_unlimited(collection_name, {body: body, size : limit});
        result = db_data.data;

        let ids = result.map(item => item._id);
        let already_downloaded = await crawler_db.read(cache_collection, {body: {"_id" : {$in: ids}}});
        let ready_products_hash = already_downloaded.reduce((res, item) => {
            res[item._id] = item;
            return res;
        }, {});

        let es_bulk = [];
        let mongo_bulk = [];

        for (let i = 0; i < result.length; i++)
        {
            let product = result[i];
            let images = options.force && product.distributor_only.images ? product.distributor_only.images : product.images;
            let document = {
                ...crawler_version ? {[field_name] : crawler_version} : ""
            };

            if (images && images.length)
            {
                let hash_product = ready_products_hash[product._id];

                if (!hash_product || !hash_product.images || options.force || options.check_uploaded)
                {
                    let supplier = product.supplier[0];
                    let distributor = product.distributor[0];

                    document.images = await single_product_upload({
                        items: images,
                        originals : product.distributor_only.images,
                        supplier,
                        distributor,
                        _id: product._id,
                        options: options
                    });
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

let single_product_upload = async({items, originals, supplier, distributor, _id, options}) => {

    for (let i = 0; i < (items || []).length; i++)
    {
        let file_data = items[i];
        let need_do_download = (file_data.link && file_data.link.indexOf("http") === 0) || file_data.file_content;

        if(!need_do_download && options.check_uploaded)
        {
            if (!(await upload_utils.s3_check_is_file_exists(`image/${distributor}/${supplier}`, file_data.link)))
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
            let new_item_names = await upload_utils.upload_product_image({
                ...file_data.link ? {link: file_data.link} : "",
                ...file_data.file_content ? {file_content: file_data.file_content} : "",
                path: `image/${distributor}/${supplier}`,
                product_id: _id,
                file_index: i,
                meta: {supplier: supplier, distributor: distributor},
                options
            });
            new_item_names.link_id ? items[i].link = new_item_names.link_id : null;
            new_item_names.thumb_link_id ? items[i].thumb_link = new_item_names.thumb_link_id : null;
            items[i].file_content ? delete items[i].file_content : ""
        }
    }
    console.log(`Uploaded ${(items || []).length} images: ${supplier}`);

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
        await upload(product_type, crawler_db, options)
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

    let items = es_product.distributor_only.images;

    if (!items  || !items.length)
        return console.error("No images");

    let supplier = es_product.supplier[0];
    let distributor = es_product.distributor[0];
    let ready_items =  await single_product_upload({items, supplier, distributor, _id: es_product._id, options: options});

    await es_db.update(collection_name, {data : {_id : es_product._id, images: ready_items}});
    console.log(es_product._id);
    console.log(ready_items);
    await crawler_db.create(cache_collection, {data : {_id : es_product._id, images: ready_items}})
};

let upload_from_directory = async (dir_path) => {

    let crawler_db = await init_crawler_db();
    await es_db.init();

    let files = fs.readdirSync(dir_path);

    let images_hash = {};

    for(let i = 0; i < files.length; i++)
    {
        let file_name = files[i];
        let file_no_extension = file_name.split(".").shift();
        let [oid, index] = file_no_extension.split("_");
        images_hash[oid] = images_hash[oid] || [];
        images_hash[oid].push(file_name)
    }

    for (let oid in images_hash)
    {
        let es_product = await es_db.read_one(collection_name, {"body" : {"query" : {"term" : {"oid" : oid}}}});
        if (!es_product){
            console.error("Product not found", oid);
            continue
        }

        let supplier    = es_product.supplier[0];
        let distributor = es_product.distributor[0];

        let items = [];

        images_hash[oid].forEach(item => {
            items.push({file_content : {html: fs.readFileSync(`${dir_path}/${item}`), content_type : "image/jpg", confirm: true}})
        });

        let ready_items =  await single_product_upload({items, supplier, distributor, _id: es_product._id});

        await es_db.update(collection_name, {data : {_id : es_product._id, images: ready_items}});
        console.log(es_product._id);
        console.log(ready_items);
        await crawler_db.create(cache_collection, {data : {_id : es_product._id, images: ready_items}})
    }
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

r("WFK 75" , {check_uploaded: true/*, force: true*/});

// upload_from_directory(`${__dirname}/files/himedia_laboratories/images`)
// .then(() => process.exit(0))
// .catch(e => { console.error(e); r() })