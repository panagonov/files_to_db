let utils = require("../../../_utils/utils.js");

let mapping = {
    "_id"              : 'accession',
    "name"             : ["protein.recommendedName.fullName.$text", "protein.recommendedName.fullName"],
    "gene"             : "gene.name.$text",
    "alias"            : "name",
};

let transform = (record) =>
{
    let result = utils.mapping_transform(mapping, record);
    return result
    return utils.mapping_transform(mapping, record);
};

module.exports = {
    transform: transform,
    disable: false
};