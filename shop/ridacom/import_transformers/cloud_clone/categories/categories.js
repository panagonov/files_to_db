let MongoDb = require("../../../../../_utils/db.js");
let utils = require("../../../../../_utils/utils.js");
let product_list = require("./product_list.json");

let mapping = {
    "tid"              : result => "ridacom",
    "src"              : result => "cloud_clone_list",
    "type"             : result => "pr_list"
};

let db_name  = "product";
let index = 0;

let transform = (record) =>
{
    let result = utils.mapping_transform(mapping, record);

    if(product_list[index])
    {
        result.link = product_list[index];  //todo hack -> this url is not product url.
        index++
    }
    return result;
};



let generate_crawler_tasks = async() => {
    let crawler_db = new MongoDb();
    await crawler_db.init({host: "172.16.1.11", database: db_name, user: "hashstyle", "pass": "Ha5h5tylE"});
    let mongo_bulk = [];
    product_list.forEach(link => {
        let document = transform({});
        let id = document.link.replace(/\W/g, "_").replace(/_+/g, "_");
        mongo_bulk.push({command_name: "upsert", _id: id, document: document})
    });
    await crawler_db.bulk("product", mongo_bulk)
};

let enrich_after_crawling = async() => {
    let crawler_db = new MongoDb();
    await crawler_db.init({host: "172.16.1.11", database: "crawlers", user: "hashstyle", "pass": "Ha5h5tylE"});

    let db_data = await crawler_db.read(db_name, {body: {src: "cloud_clone_list", ids: {$exists: true}}});
    let id_hash = {};
    let ids = []
    db_data.forEach(item =>{
        item.ids.forEach(id =>{
            ids.push(id);
            id_hash[id] =  id_hash[id] || [];
            id_hash[id].push([item.category, item.sub_category].filter(item => item));
            id_hash[id] = id_hash[id].filter(item => item.length)
        })
    });
    ids = utils.uniq(ids);
    let products = await crawler_db.read(db_name, {body: {_id: {$in: ids}}});
    let mongo_bulk = [];
    products.forEach(product =>{
        if (id_hash[product._id])
            mongo_bulk.push({command_name: "update", _id: product._id, document: {categories: id_hash[product._id]}})
    });

    await crawler_db.bulk("product", mongo_bulk)
};

enrich_after_crawling()
.then(() => process.exit(0))
.catch(e => console.error(e));