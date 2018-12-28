let utils = require("../../../_utils/utils.js");

let mapping = {
    "_id"              : (record) => `${record["ClinicalTrials.gov ID"] || ""}_${record["Core Project Number"] || ""}`,
    "clinical_trail_id": "ClinicalTrials.gov ID",
    "project_id"       : "Core Project Number",
    "description"      : "Study",
    "status"           : "Study Status"
};

let transform = (record) =>
{
    return utils.mapping_transform(mapping, record);
};

module.exports = {
    transform: transform,
    disable: false
};