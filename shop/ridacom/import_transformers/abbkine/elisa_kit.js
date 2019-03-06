let utils = require("../../../../_utils/utils.js");

let mapping = {
    "_id"              : (record) => `PRODUCT_SOURCE:[ABBKINE]_SUPPLIER:[RIDACOM]_ID:[${record["Catalog no"] || ""}]`,
    "oid"              : "Catalog no",
    "tid"              : result => "ridacom",
    "src"              : result => "abbkine",
    "type"             : result => "elisa_kit",
    "name"             : "product name",
    "host"             : record => {
        if (!record["Host"] || record["Host"].trim() === "Null")
            return null;

        return  record["Host"]
    },
    "reactivity"       : record => {
        if (!record["Reactivity"])
            return null;

        let result = record["Reactivity"].split("#").map(item => item.trim()).filter(item => {
            return item.trim() !== "Null"
        });

        return result.length ? result : null
    },
    "sequence" : record =>
    {
        if (!record["Sequence"] || record["Sequence"].trim() === "Null")
            return null;

        return record["Sequence"].replace(/\n|\t|\r/g, " ").replace(/\s+/, " ").trim()
    },
    "application"      : record => {
        if (!record["Applications"] || record["Applications"].trim() === "Null")
            return null;

        return record["Applications"].split("#").map(item => item.trim()).filter(item => item)
    },
    "immunogen" : record => {
        if (!record["Immunogen"] || record["Immunogen"].trim() === "Null")
            return null;

        return record["Immunogen"]
    },
    "cas_number" : record => {
        if (!record["CAS Number"] || record["CAS Number"].trim() === "Null")
            return null;

        return record["CAS Number"]
    },
    "description" : record => {
        if (!record["Applications notes"] || record["Applications notes"].trim() === "Null")
            return null;

        return (record["Applications notes"] || "").replace(/\n|\t|\r/g, " ").replace(/\s+/, " ").trim()
    },
    "activity" : record => {
        if (!record["Activity"] || record["Activity"].trim() === "Null")
            return null;

        return record["Activity"].split("\n").map(item => item.trim()).filter(item => item)
    },
    "clonality" : record => {
        if (!record["Clonality"] || record["Clonality"].trim() === "Null")
            return null;

        return record["Clonality"]
    },
    "isotype" : record => {
        if (!record["Isotype"] || record["Isotype"].trim() === "Null")
            return null;

        return record["Isotype"]
    },
    "protein_length" : record => {
        if (!record["Protein length"] || record["Protein length"].trim() === "Null")
            return null;

        return record["Protein length"].replace(/\n|\t|\r/g, " ").replace(/\s+/, " ").trim()
    },
    "preparation_method" : record => {
        if (!record["Preparation method"] || record["Preparation method"].trim() === "Null")
            return null;

        return record["Preparation method"]
    },
    "purification" : record => {
        if (!record["Purification"] || record["Purification"].trim() === "Null")
            return null;

        return record["Purification"]
    },
    "purity" : record => {
        if (!record["Purity"] || record["Purity"].trim() === "Null")
            return null;

        return record["Purity"]
    },
    "detection_method" : record => {
        if (!record["Detection method"] || record["Detection method"].trim() === "Null")
            return null;

        return record["Detection method"]
    },
    "conjugate" : record => {
        if (!record["Conjugate"] || record["Conjugate"].trim() === "Null")
            return null;

        return record["Conjugate"]
    },
    "sample_type" : record => {
        if (!record["Sample type"] || record["Sample type"].trim() === "Null")
            return null;

        return record["Sample type"].replace(/\n|\t|\r/g, " ").replace(/\s+/, " ").trim().split("#")
    },
    "assay_type" : record => {
        if (!record["Assay type"] || record["Assay type"].trim() === "Null")
            return null;

        return record["Assay type"].replace(/\n|\t|\r/g, " ").replace(/\s+/, " ").trim()
    },
    "assay_duration" : record => {
        if (!record["Assay duration"] || record["Assay duration"].trim() === "Null")
            return null;

        return record["Assay duration"].replace(/\n|\t|\r/g, " ").replace(/\s+/, " ").trim()
    },
    "formula" : record => {
        if (!record["Molecular formula"] || record["Molecular formula"].trim() === "Null")
            return null;

        return record["Molecular formula"]
    },
    "formulation" : record => {
        if (!record["Formulation"] || record["Formulation"].trim() === "Null")
            return null;

        return record["Formulation"]
    },
    "kit_components" : record => {
        if (!record["Kit components"] || record["Kit components"].trim() === "Null")
            return null;

        return record["Kit components"].replace(/\n|\t|\r/g, " ").replace(/\s+/, " ").split("<br>").map(item => item.trim()). filter(item => item)
    },
    "features" : record => {
        if (!record["Features & Benefits"] || record["Features & Benefits"].trim() === "Null")
            return null;

        return record["Features & Benefits"].replace(/\n|\t|\r/g, " ").replace(/\s+/, " ").split("<br>").map(item => item.trim()). filter(item => item)
    },
    "calibration_range" : record => {
        if (!record["Calibration range"] || record["Calibration range"].trim() === "Null")
            return null;

        return record["Calibration range"]
    },
    "limit_of_detection" : record => {
        if (!record["Limit of detection"] || record["Limit of detection"].trim() === "Null")
            return null;

        return record["Limit of detection"]
    },
    "concentration" : record => {
        if (!record["Concentration"] || record["Concentration"].trim() === "Null")
            return null;

        return record["Concentration"]
    },
    "mol_weight" : record => {
        if (!record["Molecular weight"] || record["Molecular weight"].trim() === "Null")
            return null;

        return parseFloat(record["Molecular weight"])
    },
    "app_notes" : record => {
        if (!record["Applications notes"] || record["Applications notes"].trim() === "Null")
            return null;

        return (record["Applications notes"] || "").split("\n").map( item => item.replace(/\s+/, " ").trim()).filter(item => item)
    },
    "usage_notes" : record => {
        if (!record["Usage notes"] || record["Usage notes"].trim() === "Null")
            return null;

        return (record["Usage notes"] || "").split("\n").map( item => item.replace(/\s+/, " ").trim()).filter(item => item)
    },
    "storage_buffer" : record => {
        if (!record["Storage buffer"] || record["Storage buffer"].trim() === "Null")
            return null;

        return record["Storage buffer"]
    },
    "storage_instructions" : record => {
        if (!record["Storage instructions"] || record["Storage instructions"].trim() === "Null")
            return null;

        return record["Storage instructions"]
    },
    "shipping" : record => {
        if (!record["Shipping"] || record["Shipping"].trim() === "Null")
            return null;

        return record["Shipping"]
    },
    "precautions" : record => {
        if (!record["Precautions"] || record["Precautions"].trim() === "Null")
            return null;

        return record["Precautions"].replace(/\n|\t|\r/g, " ").replace(/\s+/, " ").split("<br>").map(item => item.trim()). filter(item => item)
    },
    "background" : record => {
        if (!record["Background"] || record["Background"].trim() === "Null")
            return null;

        return record["Background"]
    },
    "gene_id" : record => {
        if (!record["Gene ID"] || record["Gene ID"].trim() === "Null")
            return null;

        return record["Gene ID"]
    },
    "alternative" : record => {
        if (!record["Alternative"] || record["Alternative"].trim() === "Null")
            return null;

        return record["Alternative"].split(";").map(item => item.trim()).filter(item => {
            return item !== "Null"
        });
    },
    "others" : record => {
        if (!record["Others"] || record["Others"].trim() === "Null")
            return null;

        return record["Others"].replace(/\n|\t|\r/g, " ").replace(/\s+/, " ").trim()
    },
    "accession" : record => {
        if (!record["Accession"] || record["Accession"].trim() === "Null")
            return null;

        return record["Accession"]
    },
    "accession_link" : record => {
        if (!record["Accession link"] || record["Accession link"].trim() === "Null")
            return null;

        return record["Accession link"]
    },
    "category" : record => {
        if (!record["Category"] || record["Category"].trim() === "Null")
            return null;

        return record["Category"]
    },
    "link" : "Product url",
    "price" : record =>{
        let result = [];

        for (let i = 1; i <= 4; i++)
        {
            let price = parseFloat(record["Price" + i] || record["price" + i]);
            let size = record["Size" + i] || record["size" + i];
            if (size === "Null")
                size = "";

            if (price && size)
            {
                result.push({price, size})
            }
        }
        return result
    }
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