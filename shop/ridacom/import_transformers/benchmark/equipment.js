let utils = require("../../../../_utils/utils.js");
let product_list = require("./product_list.json");

let mapping = {
    "_id"              : record => `PRODUCT_SOURCE:[BENCHMARK]_SUPPLIER:[RIDACOM]_ID:[${record["Item No."].trim() || ""}]`,
    "oid"              : record => record["Item No."].trim(),
    "tid"              : result => "ridacom",
    "src"              : result => "benchmark",
    "type"             : result => "equipment",
    "name"             : record => record["Product Description"] ? record["Product Description"].replace(/\s+/g, " ").trim() : null,
    "weight"           : record => record["Shipping Weight (Kg)"] ? parseFloat(record["Shipping Weight (Kg)"]) : null,
    "price"            : (record) => {

        if (!record["Suggested List Price"])
            return null;

        let price = parseFloat(record["Suggested List Price"].replace("$", "").trim());

        return {
            "is_multiple" : false,
            "is_ids_are_unique" : false,
            "search_price" : price || 0,
            "variation" :[{
                "price" : {
                    "value"   : price || 0,
                    "currency":"usd"
                }
            }]
        };
    },
    "distributor_only" : record => {
        let result = {};

        if (record["Distributor Cost"])
        {
            let price = parseFloat(record["Distributor Cost"].replace("$", "").trim());
            result.distributor_price = {
                "value" : price,
                "currency" : "usd"
            }
        }

        if (record["Distributor Cost - Qty Orders"])
        {
            let price = parseFloat(record["Distributor Cost - Qty Orders"].replace("$", "").trim());
            result.distributor_price_qty_orders = {
                "value" : price,
                "currency" : "usd"
            }
        }

        return result
    }
};

let index = 0;
let link_hash = {};

let category = "";
let accessories = false;

let transform = (record) =>
{
    if (!record["Product Description"]){
        category = record["Item No."];
        accessories = false;
        return;
    }

    if (!record["Item No."])
    {
        if (record["Product Description"] && record["Product Description"].indexOf("Accessories") !== -1)
        {
            accessories = true;
        }
        return;
    }

    let result = utils.mapping_transform(mapping, record);
    result.category = category;
    accessories ? result.accessories = true : null;

    if (link_hash[result._id])
        result.link = link_hash[result._id];
    else
    {
        if(product_list[index])
        {
            result.link = product_list[index];  //todo hack -> this url is not product url.
            link_hash[result._id] = result.link;
            index++
        }
    }

    return result;
};

module.exports = {
    transform: transform,
    disable: false
};