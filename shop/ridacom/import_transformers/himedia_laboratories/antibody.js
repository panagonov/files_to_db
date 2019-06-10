let utils = require("../../../../_utils/utils.js");


let mapping = {
    "_id"              : record => `PRODUCT_SOURCE:[HIMEDIA]_SUPPLIER:[RIDACOM]_ID:[${record["Product Code"].trim() || ""}]`,
    "oid"              : record => record["Product Code"].trim(),
    "tid"              : result => "ridacom",
    "src"              : result => "himedia_laboratories",
    "type"             : result => "unclassified",
    "name"             : "Product Description",
    "price"            : (record) => {
        return ({"value": parseFloat(record["END USER PRICING IN EUR WITHOUT TAXES"]), "currency" : "eur"})
    }
};

let transform = (record) =>
{

    let result = utils.mapping_transform(mapping, record);

    if (!result.name || !result.oid)
    {
        result = null
    }

    return result;
};

module.exports = {
    transform: transform,
    disable: false
};