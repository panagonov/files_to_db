/********************************************************************
 *
 * http://www.cloud-clone.com/
 *
 ********************************************************************/

let file_importer = require("./file_importer.js");

let collection_name = "ridacom";

let run = async(mongo_db) =>
{
    await file_importer.run(mongo_db, collection_name, "cloud_clone")
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