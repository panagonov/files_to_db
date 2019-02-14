let utils = require("../../../../_utils/utils.js");

let mapping = {
    "_id"              : (record) => `PRODUCT_SOURCE:[CLOUD_CLONE]_SUPPLIER:[RIDACOM]_ID:[${record["Product No."] || ""}]`,
    "oid"              : "Product No.",
    "tid"              : result => "ridacom",
    "src"              : result => "cloud_clone",
    "type"             : result => "elisa_kit",
    "name"             : "Product Name",
    "format"           : record => record["Format"] ? record["Format"].replace("<i>", "").replace("</i>", "").trim() : null,
    "range"            : "Detection range",
    "application"      : record => {
        if (!record["Application"])
            return null;

        return record["Application"].split(";").map(item => item.trim()).filter(item => item)
    },
    "price"            : (record) => {
        if (!record["List Price\n(USD)"])
        {
            return null
        }

        let originalValue = parseFloat(record["List Price\n(USD)"]);
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
        if (!record["RIDACOM price\n(USD)"])
        {
            return null
        }

        return {
            price : {
                value : parseFloat(record["RIDACOM price\n(USD)"]),
                currency : "usd",
            }
        }
    },
    "reactivity"       : record => {
        if (!record["Organism species"])
            return null;

        return record["Organism species"].split(";").map(item => {
            item = item.trim().split("(").pop();
            return item.replace(")", "")
        }).filter(item => item)
    },
    "sensitivity"      : record => record["Sensitivity"] ? record["Sensitivity"].trim() : null,
    "sample_type"      : record =>  {
            if (!record["Sample type"] || record["Sample type"] === "Null")
                return null;
            return record["Sample type"].replace(/\n|\t|\r/g, " ").replace(/\s+/, " ").split(",").map(item => item.trim().replace(/\.$/, ""))
    },

    "link"             : "Web links",
    "pdf"              : record => record["Manual Links"] ? ({link: record["Manual Links"]}) : null,
    "images"           : record => record["OD Images"] ? [record["OD Images"]] : null,
    "assay_length"     : "Assay length",
    "method"           : "Method",
    "specificity"      : record => record["Specificity"] ? record["Specificity"].replace("<p>", "").replace("</p>", "").split("<br/>").map(item => item.trim()).filter(item => item) : null,
    "precision"        : record => record["Precision"] ? record["Precision"].replace("<p>", "").replace("</p>", "").split("<br/>").map(item => item.trim()).filter(item => item) : null,
    "stability"        : record => record["Stability"] ? record["Stability"].replace("<p>", "").replace("</p>", "").split("<br/>").map(item => item.trim()).filter(item => item) : null,
    "procedure"        : record => record["Assay procedure summary"] ? record["Assay procedure summary"].replace("<p>", "").replace("</p>", "").split("<br/>").map(item => item.trim()).filter(item => item) : null,
    "test_principle"   : record => record["Test principle"] ? record["Test principle"].trim() : null,
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
    "shelf_life"       : " Shelf-Life",
    "storage_conditions" : record => record["Storage Conditions"] ? record["Storage Conditions"].replace(/\n/g, " ") : null,
    "delivery_conditions": "storage conditions during delivery"
};

let transform = (record) =>
{
    let result = utils.mapping_transform(mapping, record);
    return result;
};

module.exports = {
    transform: transform,
    disable: false
};