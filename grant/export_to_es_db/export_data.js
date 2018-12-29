let export_patents = require("./export_patents.js");
let export_grants = require("./export_grants.js");
let update_relations = require("./update_relations.js");

let run = async(mongo_db) =>
{
    await export_patents(mongo_db);
    await export_grants(mongo_db);
    await update_relations("patent");
    await update_relations("grant");
};

module.exports = {
    run
};