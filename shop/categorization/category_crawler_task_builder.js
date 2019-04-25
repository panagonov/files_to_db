let urls = require("./categorization.json");
let MongoDb = require("../../_utils/db.js");

let crawler_db;
let db_name  = "product";

let init = async () =>
{
    crawler_db = new MongoDb();
    await crawler_db.init({host: "172.16.1.11", database: db_name, user: "hashstyle", "pass": "Ha5h5tylE"});
};

let run = async() =>
{
    await init();

    let mongo_bulk = urls.map(url => ({
        "command_name": "upsert",
        "_id" : url.replace(/\W/g, "_").toLowerCase().replace(/_+/g, "_").replace(/^_|_$/, ""),
        "document" : {
            "src": "biocompare",
            "link": url
        }
    }));

    await crawler_db.bulk(db_name, mongo_bulk)
};

run()
.then(() => process.exit(1))
.catch(e => console.error(e));