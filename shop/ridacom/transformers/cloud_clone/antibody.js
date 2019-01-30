let utils = require("../../../../_utils/utils.js");

let mapping = {
    "_id"              : (record) => `PRODUCT_SOURCE:[CLOUD_CLONE]_SUPPLIER:[RIDACOM]_ID:[${record["Product No."] || ""}]`,
    "oid"              : "Product No.",
    "tid"              : result => "ridacom",
    "src"              : result => "cloud_clone",
    "type"             : result => "antibody",
    "name"             : "Product Name",
    "source"           : "Source",
    "host"             : record => {
        if (!record["Host"] && !!record["Host"].trim())
            return null;
        if (record["Host"] === "n/a")
            return null;
        return record["Host"]
    },
    "clone_num"        : "Potency (Clone Number)",
    "isotype"          : "Ig Isotype",
    "fragment"         : record => !record["Fragment"] || record["Fragment"].trim() === "-" ? null : record["Fragment"],
    "reactivity"       : record => {
        if (!record["Organism species"])
            return null;

        return record["Organism species"].replace(/,/g, ";").split(";").map(item => {
            item = item.replace(".", "").trim().split("(").pop();
            return item.replace(")", "")
        }).filter(item => item && item !== "0")
    },
    "concentration"    : "Concentration",
    "price"            : (record) => {
        if (!record["100ul/$"])
        {
            return null
        }

        let originalValue = parseFloat(record["100ul/$"]);
        let discountPercentage = 0;
        let discount = 0;

        if (record["Discount"])
        {
            discountPercentage = parseFloat(record["Discount"]) * 100;
            discount = originalValue * (discountPercentage / 100)
        }

        return {
            value : discount || originalValue,
            currency : "usd",
            ...record["Discount"] ? {"isPromotion": true}: "",
            ...record["Discount"] ? {"promotion": {
                    "discount": discount,
                    "discountPercentage": discountPercentage,
                    "originalValue": originalValue
                }}: ""
        }
    },
    "supplier_specific": (record) => {
        if (!record["RIDACOM price/100ul\n(USD)"])
        {
            return null
        }

        return {
            price : {
                value : parseFloat(record["RIDACOM price/100ul\n(USD)"]),
                currency : "usd",
            }
        }
    },
    "application"      : record => {
        if (!record["Application"])
            return null;

        return record["Application"].replace(/,/g, ";").split(";").map(item => item.replace(".", "").replace("Applications:", "").trim()).filter(item => item)
    },
    "link"             : "Web link",
    "pdf"              : record => record["Manual Links"] ? ({link: record["Manual Links"]}) : null,
    "aliases"          : record => {
        if (!record["Alternative Names"])
            return null;

        return record["Alternative Names"].split(";").map(item => item.trim()).filter(item => item)
    },
    "item_name"        : "Item Name",
    "research_area"    : record => {
        if (!record["Research Area"])
            return null;

        return record["Research Area"].split(";").map(item => item.trim()).filter(item => item)
    },
    "reference"        :  record => {
        if (!record["Reference"])
            return null;

        let link = record["Reference"].replace(/\n/g, " ");
        let match = /"\s?([http|www].+)"/.exec(link);

        return match && match[1] ? match[1].trim() : null
    },
    "buffer_form"      : "Buffer Formulation",
    "immunogen"        : "Immunogen",
    "usage"            : record => {
        if (!record["USAGE"])
            return null;

        return record["USAGE"].split("<br/>").map(item => item.trim()).filter(item => item)
    },
    "shelf_life"       : " Shelf-Life",
    "storage_conditions" : record => record["Storage Conditions"] ? record["Storage Conditions"].replace(/\n/g, " ") : null,
    "delivery_conditions": "storage conditions during delivery"
};

let transform = (record) =>
{
    if (!record["Product No."])
        return null;

    let result = utils.mapping_transform(mapping, record);

    return result;
};

module.exports = {
    transform: transform,
    disable: false
};