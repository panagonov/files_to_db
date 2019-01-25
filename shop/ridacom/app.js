/********************************************************************
 *
 * http://www.cloud-clone.com/
 * https://www.abbkine.com/
 * https://www.capp.dk/
 * http://www.genomeme.ca
 *
 ********************************************************************/

let file_importer = require("./file_importer.js");
let aggregate_data = require("./aggregate.js");
let save_to_es_db = require("./save_to_es_db.js");

let collection_name = "ridacom";

let run = async(mongo_db) =>
{
    await file_importer.run(mongo_db, collection_name, "cloud_clone");
    // await file_importer.run(mongo_db, collection_name, "abbkine");
    // await file_importer.run(mongo_db, collection_name, "capp");
    // await file_importer.run(mongo_db, collection_name, "genome_me");

    // await aggregate_data(mongo_db, "cloud_clone");
    // await aggregate_data(mongo_db, "abbkine");

    await save_to_es_db.run(mongo_db);
};

let clean = async(mongo_db) =>
{
    fs.writeFileSync(__dirname + "/progress.json", "{}", "utf8");

    await mongo_db.remove_by_query(collection_name, {body: {tid: collection_name}})
};

module.exports = {
    run,
    clean
};