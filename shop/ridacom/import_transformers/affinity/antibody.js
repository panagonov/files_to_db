let utils      = require("../../../../_utils/utils.js");
let save_utils = require("../../../_utils/save_utils.js");

let id_hash = {};

let mapping = {
    "_id"           : (record) => `PRODUCT_SOURCE:[AFFINITY]_SUPPLIER:[RIDACOM]_ID:[${record["ProductID"] || ""}]`,
    "oid"           : "ProductID",
    "tid"           : record => "ridacom",
    "src"           : record => "affinity",
    "type"          : record => "antibody",
    "name"          : "ProductName",
    "price"         : record => {
        let price = {
            "is_multiple"      : false,
            "is_ids_are_unique": false,
            "variation"        : [
                {
                    "price": {
                        "value"   : parseFloat(record.Price),
                        "currency": "usd"
                    },
                    "size" : save_utils.size_parser(record.Quantity)
                }
            ]
        };

        if (id_hash[record["ProductID"]]) {
            price.is_multiple = true;
            id_hash[record["ProductID"]].push(price.variation[0]);
            price.variation = JSON.parse(JSON.stringify(id_hash[record["ProductID"]]));
        } else {
            id_hash[record["ProductID"]] = JSON.parse(JSON.stringify(price.variation));
        }

        return price;
    },
    "antigen"       : "Antigen",
    "host"          : "Host",
    "clonality"     : "Clonality",
    "isotype"       : "Isotype",
    "conjugate"     : "Conjugate",
    "immunogen"     : "Immunogen",
    "purification"  : "purification",
    "link"          : "WebLink",
    "buffer_form"   : "Format",
    "storage_buffer": "Storage_Buffer",
    "reactivity"    : record => record["Reactivity"] ? record["Reactivity"].split(",").map(item => item.trim()).filter(item => item) : null,
    "application"   : record => record["Application"]? record["Application"].split(",").map(item => item.trim()).filter(item => item) : null,
    "concentration" : record => record["Concentration"] ? save_utils.size_parser(record["Concentration"]) : null,
    "specificity"   : record => record["Specificity"] ? [record["Specificity"]] : null,
    "predict"       : record => record["Predict"] ? record["Predict"].split(",").map(item => item.trim()).filter(item => item) : null
};

let transform = (record) => {
    let result = utils.mapping_transform(mapping, record);
    return result;
};

module.exports = {
    transform: transform,
    disable  : false
};