let utils = require("../../../../_utils/utils.js");
let product_list = require("./product_list.json");

let id_url_mapping = product_list.reduce((res, url) =>
{
    let product_id = decodeURIComponent(url.split("/").pop().replace(".html", "").toLowerCase()).trim();
    res[product_id] = url;
    return res
}, {});

let mapping = {
    "_id"              : (record) => `PRODUCT_SOURCE:[GENOME_ME]_SUPPLIER:[RIDACOM]_ID:[${record["Clone"] || ""}]`,
    "oid"              : "Clone",
    "tid"              : result => "ridacom",
    "src"              : result => "genome_me",
    "type"             : result => "antibody",
    "name"             : "Antigen",

    "price"            : (record) => {
       if (!record["0.1ml C"] && !record["1ml C"] && !record["7ml P"]&& !record["25ml P"] )
           return null;

        let result = [];

        record["0.1ml C"] ? result.push({size: "0.1ml C", price: parseFloat(record["0.1ml C"].replace("$", ""))}) : null;
        record["1ml C"] ? result.push({size: "1ml C", price: parseFloat(record["1ml C"].replace("$", ""))}) : null;
        record["7ml P"] ? result.push({size: "7ml P", price: parseFloat(record["7ml P"].replace("$", ""))}) : null;
        record["25ml P"] ? result.push({size: "25ml P", price: parseFloat(record["25ml P"].replace("$", ""))}) : null;

        return result

    },
    "new" : "New"  //add label manual

};

let transform = (record) =>
{
    let result = utils.mapping_transform(mapping, record);

    if (!result.price || !result.price.length)
        return null;

    let id = decodeURIComponent(result.name).replace(/\W/g, "-").replace(/\-+/g, "-").replace(/\-$/, "").toLowerCase();
    id_url_mapping[id] ? result.link = id_url_mapping[id] : null;

    return result;
};

module.exports = {
    transform: transform,
    disable: false
};