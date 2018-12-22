let utils = require("./utils/utils.js");

let mapping = {
    "_id"           : (record) => `${record.PMID || ""}_${record.PROJECT_NUMBER || ""}`,
    "pubmed_id"     : "PMID",
    "project_number": "PROJECT_NUMBER"
};

let transform = (record) =>
{
    return utils.mapping_transform(mapping, record);
};

module.exports = {
    transform: transform,
    disable: false,
    allow_duplicated: true
};