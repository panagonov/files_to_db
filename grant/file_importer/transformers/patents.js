let utils = require("../../../_utils/utils.js");

let mapping = {
    "_id"              : "PATENT_ID",
    "name"             : "PATENT_TITLE",
    "organization_name": "PATENT_ORG_NAME",
    "project_id"       : "PROJECT_ID",
    "external_links"        : (record) => {
        return [{key: "JUSTIA", id: record["PATENT_ID"]}];
    },
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