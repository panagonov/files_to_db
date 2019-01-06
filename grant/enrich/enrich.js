let enrich_patents = require ("./patents.js");
let patent_patent_rel = require ("./patent_patent_rel.js");
let MongoDb = require("../../_utils/db.js");

let crawler_mongo_db;
let mongo_conf = {
    "host"             : "85.10.244.21",
    "port"             : "27017",
    "database"         : "crawlers",
    "user"             : "hashstyle",
    "pass"             : "Ha5h5tylE",
    "socketTimeoutMS"  : 120000,
    "connectTimeoutMS" : 6000,
    "tryToConnect"     : 10,
    "delayBetweenRetry": 5000
};

let init = async () =>
{
    crawler_mongo_db = new MongoDb();
    await crawler_mongo_db.init(mongo_conf);
};

let run = async(mongo_db) =>
{
    await init();
    await patent_patent_rel.run(crawler_mongo_db);
    await enrich_patents.run(crawler_mongo_db);
};

module.exports = {
    run
};