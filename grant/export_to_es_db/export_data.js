let export_patents = require("./export_patents.js");
let export_grants = require("./export_grants.js");
let update_relations = require("./update_relations.js");

let run = async(mongo_db) =>
{
    await export_patents(mongo_db);
    // await export_grants(mongo_db);
    // await update_relations.run("patent");
    // await update_relations.run("grant");
};

let clean = async() => {
    await update_relations.clean("patent_relations_count");
    await update_relations.clean("grant_relations_count");
};

module.exports = {
    run,
    clean
};