/********************************************************************
 *
 * http://www.cloud-clone.com/
 * https://www.abbkine.com/
 * https://www.capp.dk/
 * http://www.genomeme.ca
 * https://www.adamequipment.co.uk
 *
 ********************************************************************/

let fs = require("fs");
let file_importer = require("./file_importer.js");
let aggregate_data = require("./aggregate.js");
let save_to_es_db = require("./save_to_es_db.js");

let collection_name = "ridacom";

let suppliers = fs.readdirSync(__dirname + "/transformers");

let run = async(mongo_db, crawler_db) =>
{
    for (let i = 0; i < suppliers.length; i++)
    {
        await file_importer.run(mongo_db, collection_name, suppliers[i]);
        await aggregate_data.run(mongo_db, crawler_db, suppliers[i]);
    }

    // await save_to_es_db.run(mongo_db, crawler_db);
};

let clean = async(mongo_db) =>
{
    fs.writeFileSync(__dirname + "/progress.json", "{}", "utf8");

    await mongo_db.remove_by_query(collection_name, {body: {tid: collection_name}})
    await file_importer.clean();
    await aggregate_data.clean();
};

module.exports = {
    run,
    clean
};