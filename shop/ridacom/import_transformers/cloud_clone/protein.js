let utils = require("../../../../_utils/utils.js");

let mapping = {
    "_id"              : (record) => `PRODUCT_SOURCE:[CLOUD_CLONE]_SUPPLIER:[RIDACOM]_ID:[${record["Product No."] || ""}]`,
    "oid"              : "Product No.",
    "tid"              : result => "ridacom",
    "src"              : result => "cloud_clone",
    "type"             : result => "protein",
    "name"             : "Product Name",
    "source"           : "Source",
    "host"             : "Host",
    "purity"           : "Purity",
    "p_mol_mass"       : "Predicted Molecular Mass(KD)",
    "a_mol_mass"       : "Accurate Molecular Mass(KD)",
    "fragment"         : "Fragment",
    "reactivity"       : record => {
        if (!record["Organism species"])
            return null;

        return record["Organism species"].split(";").map(item => {
            item = item.trim().split("(").pop();
            return item.replace(")", "")
        }).filter(item => item)
    },
    "expression"       : "Expression System",
    "tag"              : "Tag",
    "size"             : record => {
        if (!record["UOM"])
        {
            return null
        }
        return {
            "quantity": parseFloat(record["UOM"]),
            "units": record["UOM"].replace(/^\d+/, "")
        }
    },
    "price"            : (record) => {
        if (!record["List Price\n(USD)"])
        {
            return null
        }

        let originalValue = parseFloat(record["List Price\n(USD)"]);

        return {
            value :originalValue,
            currency : "usd",
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
    "application"      : record => {
        if (!record["Application"])
            return null;

        return record["Application"].split(";").map(item => item.trim()).filter(item => item)
    },
    "link"             : "Web link",
    "pdf"              : record => record["Manual Links"] ? ({link: record["Manual Links"]}) : null,
    "aliases"          : record => {
        if (!record["Alternative Names"])
            return null;

        return record["Alternative Names"].split(";").map(item => item.trim()).filter(item => item)
    },
    "item_name"        : record => record["Item Name"] && record["Item Name"].trim() ? record["Item Name"].trim() : null,
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
    "subcell_location" : record => record["Subcellular Location"] && record["Subcellular Location"] !== "n/a" ? record["Subcellular Location"] : null,
    "endotoxin_level"  : "Endotoxin Level",
    "buffer_form"      : "Buffer Formulation",
    "traits"           : "Traits",
    "isoelectric_point": record => {
        if (!record["Isoelectric Point"])
            return null;

        return parseFloat(record["Isoelectric Point"])
    },
    "shelf_life" : " Shelf-Life",
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