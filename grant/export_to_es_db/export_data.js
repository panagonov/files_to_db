let export_patents = require("./export_patents.js");

let run = async(mongo_db) =>
{
    await export_patents(mongo_db)
};

module.exports = {
    run
};