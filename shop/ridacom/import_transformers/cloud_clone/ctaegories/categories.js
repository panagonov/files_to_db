let MongoDb = require("../../../../../_utils/db.js");
let utils = require("../../../../../_utils/utils.js");
let product_list = require("./product_list.json");

let mapping = {
    "tid"              : result => "ridacom",
    "src"              : result => "cloud_clone_list",
    "type"             : result => "pr_list"
};

let crawler_db;
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

let init = async () =>
{
    crawler_db = new MongoDb();
    await crawler_db.init({host: "172.16.1.11", database: db_name, user: "hashstyle", "pass": "Ha5h5tylE"});
};


let run = async() => {
    await init();
    let mongo_bulk = [];
    product_list.forEach(link => {
        let document = transform({});
        let id = document.link.replace(/\W/g, "_").replace(/_+/g, "_");
        mongo_bulk.push({command_name: "upsert", _id: id, document: document})
    });
    await crawler_db.bulk("product", mongo_bulk)
};

run()
.then(() => process.exit(0))
.catch(e => console.error(e));