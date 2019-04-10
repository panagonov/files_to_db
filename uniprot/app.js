/********************************************************************
 *
 * https://www.uniprot.org/downloads
 * ftp://ftp.uniprot.org/pub/databases/uniprot/current_release/knowledgebase/complete/uniprot_sprot.xml.gz
 *
 ********************************************************************/

let MongoDb       = require("../_utils/db.js");
let es_db         = require("../_utils/es_db.js");
let file_importer = require("./file_importer/file_importer.js");

let mongo_db;
let db_name  = "uniprot";

let init = async () =>
{
    mongo_db = new MongoDb();
    await mongo_db.init({database: db_name});
    await es_db.init();
};

let start = async () =>
{
    await init();
    await file_importer.run(mongo_db);
};

let clean = async () =>
{
    await init();
    await file_importer.clean(mongo_db);
};

let st = () =>
    start()
    .then(() => process.exit(0))
    .catch(e => {
        console.error(e);
        st()
    });

st();