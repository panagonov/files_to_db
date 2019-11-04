require('module-alias/register');
let MongoDb = require("../_utils/db.js");
let es_db   = require("../_utils/es_db.js");
let ridacom = require("./ridacom/app.js");

let mongo_db;
let crawler_db;
let db_name  = "product";

let init = async () =>
{
    mongo_db = new MongoDb();
    await mongo_db.init({database: db_name, user: "hashstyle", "pass": "Ha5h5tylE"});

    crawler_db = new MongoDb();
    await crawler_db.init({host: "172.16.1.11", database: "crawlers", user: "hashstyle", "pass": "Ha5h5tylE"});

    await es_db.init();
};

let start = async () =>
{
    await init();
    await ridacom.run(mongo_db, crawler_db)
};

let clean = async () =>
{
    await init();
    await ridacom.clean(mongo_db, crawler_db);
};

let st = () =>
    start()
    .then(() => process.exit(0))
    .catch(e => {
        console.error(e);
        st()
    });

st();

// clean()
// .then(() => process.exit(0))
// .catch(e => console.error(e));