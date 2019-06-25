let utils        = require("../../../../_utils/utils.js");
let import_utils = require("../../../_utils/save_utils.js");
let transformers = require("./abbkine/transformers.js");

let relation_fields = ["supplier", "distributor", "application", "category", "preparation_method"];

let mapping = {
    "name"               : "name",
    "oid"                : "oid",
    "formulation"        : "formulation",
    "usage"              : "usage_notes",
    "storage_conditions" : "storage_instructions",
    "delivery_conditions": "shipping",
    "purification"       : "purification",
    "purity"             : "purity",
    "formula"            : "formula",
    "features"           : "features",
    "storage_buffer"     : "storage_buffer",
    "precautions"        : "precautions",
    "aliases"            : "alternative",
    "original_link"      : "link",
    "app_notes"          : "app_notes",
    "human_readable_id"  : record => `abbkine_scientific_co_ltd_${import_utils.human_readable_id(record.name, record.oid)}`,
    "molecular_weight"   : record => !record["mol_weight"] ? null : import_utils.size_parser(record["mol_weight"]),
    "description"        : record => record["background"] ? [record["background"]] : null,
    "preparation_method" : record => import_utils.get_canonical(record.host || "", [":host", ":reactivity", ":preparation_method"]),
    "supplier"           : record => import_utils.get_canonical("Abbkine Scientific Co., Ltd.", ":supplier"),
    "distributor"        : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "application"        : record => import_utils.get_canonical((record.application || []).join("; "), ":application"),
    "external_links"     : transformers.get_external_links,
    "category"           : transformers.get_category,
    "price_model"        : transformers.get_price_model,
    "images"             : transformers.get_images,
    "pdf"                : transformers.get_pdf,

};

let convert = (item, crawler_item) =>
{
    let record = Object.assign({}, item, {crawler_item: crawler_item});

    let result = utils.mapping_transform(mapping, record);
    let service_data = import_utils.build_service_data(result, relation_fields);
    result = Object.assign(result, service_data);

    let suggest_data = import_utils.build_suggest_data(result, relation_fields, result.category[0][1]);
    result           = import_utils.clean_result_data(result, relation_fields);

    return {
        converted_item : result,
        suggest_data,
    }
};

module.exports = {
    convert,
    version: 1
};