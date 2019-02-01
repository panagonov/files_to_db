let utils = require("../../../../_utils/utils.js");
let product_list = require("./product_list.json");

let mapping = {
    "_id"              : record => `PRODUCT_SOURCE:[CAPP]_SUPPLIER:[RIDACOM]_ID:[${record["Catalogue number"].trim() || ""}]`,
    "oid"              : record => record["Catalogue number"].trim(),
    "tid"              : result => "ridacom",
    "src"              : result => "capp",
    "type"             : result => "equipment",
    "name"             : "Description",
    "price"            : (record) => {
        let result = [];
        record["End-user price US$"] ? result.push({value: parseFloat(record["End-user price US$"]), currency: "usd"}) : null;
        record["End-user price EUR"] ? result.push({value: parseFloat(record["End-user price EUR"]), currency: "eur"}) : null;
        record["End-user price GBP"] ? result.push({value: parseFloat(record["End-user price GBP"]), currency: "gpb"}) : null;

        if (!result.length)
            return null;

        return result
    }
};

let index = 0;

let transform = (record) =>
{
    if (!record["Catalogue number"])
        return null;

    let result = utils.mapping_transform(mapping, record);

    if (!result.name)
    {
        result = null
    }
    else if(product_list[index])
    {
        result.link = product_list[index];  //todo hack -> this url is not product url.
        index++
    }

    return result;
};

module.exports = {
    transform: transform,
    disable: false
};