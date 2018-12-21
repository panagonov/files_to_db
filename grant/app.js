/********************************************************************
 *
 * https://exporter.nih.gov/ExPORTER_Catalog.aspx?sid=1&index=0
 *
 ********************************************************************/

let file_importer = require("./file_importer/file_importer.js");
let MongoDb       = require("../_utils/db.js");

let mongo_db;
let db_name  = "grant";

let init = async () =>
{
    mongo_db = new MongoDb();
    await mongo_db.init({database: db_name})
};

let start = async () =>
{
    await init();
    await file_importer(mongo_db)
};

start()
.then(() => process.exit(0))
.catch(e => console.error(e));