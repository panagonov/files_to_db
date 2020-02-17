require('module-alias/register');
let Mongo_db = require("@crawler/_utils/db.js");
let config   = require('@bioseek/core/config.js');
let es_db    = require("@bioseek/core/db/elasticsearch/db.js");
let utils    = require("@bioseek/core/utilities/utils.js");
let ridacom  = require("./ridacom/app.js");

let mongo_db;
let crawler_db;
let db_name  = "product";

let init = async () =>
{
    mongo_db = new Mongo_db();
    let mongo_conf = utils.clone(config.get("crawler:authors:mongo_db"));
    mongo_conf.database = db_name;

    await mongo_db.init(mongo_conf);

    crawler_db = new Mongo_db();
    await crawler_db.init(config.get("crawler:authors:mongo_db"));

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