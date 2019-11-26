/********************************************************************
 *
 * https://exporter.nih.gov/ExPORTER_Catalog.aspx?sid=1&index=0
 *
 ********************************************************************/

let MongoDb       = require("../_utils/db.js");
let es_db         = require("../_utils/es_db.js");
let file_importer = require("./file_importer/file_importer.js");
let keywords      = require("./keywords/keywords.js");
let affiliate     = require("./affiliate/affiliate.js");
let export_data   = require("./export_to_es_db/export_data.js");
let enrich_data   = require("./enrich/enrich.js");

let mongo_db;
let db_name  = "grant";

let init = async () =>
{
    mongo_db = new MongoDb();
    await mongo_db.init({database: db_name});
    await es_db.init();
};

let start = async () =>
{
    await init();
    // await file_importer.run(mongo_db);
    // await keywords.run(mongo_db);
    // await affiliate.run(mongo_db);
    // await export_data.run(mongo_db);
    await enrich_data.run(mongo_db)
};

let clean = async () =>
{
    await init();
    await keywords.clean(mongo_db);
    await file_importer.clean(mongo_db);
    await affiliate.clean(mongo_db);

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