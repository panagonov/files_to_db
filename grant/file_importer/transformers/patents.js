let utils = require("./utils/utils.js");

let mapping = {
    "_id"              : "PATENT_ID",
    "name"             : "PATENT_TITLE",
    "organization_name": "PATENT_ORG_NAME",
    "project_id"       : "PROJECT_ID"
};

let transform = (record) =>
{
    return utils.mapping_transform(mapping, record);
};

module.exports = {
    transform: transform,
    disable: false
};