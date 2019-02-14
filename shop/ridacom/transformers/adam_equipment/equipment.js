let utils = require("../../../../_utils/utils.js");
let product_list = require("./product_list.json");

let get_oid = (value) =>
{
    let match = /(^\d+\s)/.exec(value);
    if (match)
        return match[0];
    return value
};

let get_name = (value) =>
{
    let match = /^\d+\s(.+$)/.exec(value);
    if (match)
        return match[1];
    return value
};

let mapping = {
    "_id"              : record => `PRODUCT_SOURCE:[ADAM_EQUIPMENT]_SUPPLIER:[RIDACOM]_ID:[${ get_oid( record["Range/Model"] ) }].trim() || ""}]`,
    "oid"              : record => get_oid(record["Range/Model"]).trim(),
    "tid"              : record => "ridacom",
    "src"              : record => "adam_equipment",
    "type"             : record => "equipment",
    "name"             : record => get_name(record["Range/Model"]).trim(),
    "capacity"         : record => record["Capacity"] ? record["Capacity"].replace(/\s/g, "") : null,
    "readability"      : "Readability",
    "pan_size"         : record => record["Pan size"] && record["Pan size"] !== "-" ? record["Pan size"] : null,
    "price"            : (record) => {
        return {
            "value" : parseFloat(record["EURO LIST"]),
            "currency" : "eur"
        }
    }
};

let index = 0;

let accessories = false;

let transform = (record) =>
{
    if (!record["Range/Model"] || record["Range/Model"] === "Model")
        return null;

    if (!record["Capacity"] && !record["EURO LIST"])
    {
        accessories = record["Range/Model"].toLowerCase().trim() === "accessories";
        return null;
    }

    let result = utils.mapping_transform(mapping, record);

    accessories ? result.sub_category = "accessories" : null;

    if(product_list[index])
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