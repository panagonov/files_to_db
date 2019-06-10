let utils        = require("../../../../_utils/utils.js");
let import_utils = require("../../../_utils/save_utils.js");
let transformers = require("./himedia/transformers.js");
let save_fn      = require("./himedia/save_fn.js");

let relation_fields = ["supplier", "distributor", "category", "sub_category"];
let export_version  = 32;

let mapping = {
    "_id"                   : record => `PRODUCT_SOURCE:[HIMEDIA]_SUPPLIER:[RIDACOM]_ID:[${record["oid"].trim() || ""}]`,
    "name"                  : "name",
    "oid"                   : "oid",
    "original_link"         : "original_link",
    "images"                : "original_items.images",
    "supplier"              : record => import_utils.get_canonical("Himedia Laboratories", ":supplier"),
    "distributor"           : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "human_readable_id"     : record => `himedia_laboratories_${import_utils.human_readable_id(record.name, record.oid)}`,
    "description"           : record => record["description"] ? [record["description"]] : null,
    "others"                : record => record["used_for"] ? record["used_for"][0] : null,
    "external_links"        : transformers.get_external_links,
    "price_model"           : transformers.get_price_model,
    "shelf_life"            : transformers.get_shelf_life,
    "formula"               : transformers.get_formula,
    "molecular_weight"      : transformers.get_molecular_weight,
    "storage_conditions"    : transformers.get_storage_conditions,
    "aliases"               : transformers.get_aliases,
    "buffer_form"           : transformers.get_buffer_form,
    "safety"                : transformers.get_safety,
    "risk"                  : transformers.get_risk,
    "pdf"                   : transformers.get_pdf,
    "category"              : transformers.get_category,
};


let convert = (item, original_items) =>
{
    let record = Object.assign({}, item, {original_items: original_items});

    let result = utils.mapping_transform(mapping, record);

    let service_data = import_utils.build_service_data(result, relation_fields);
    result = Object.assign(result, service_data);

    if (!result.category.length)
        return {converted_item: null};

    let suggest_data = import_utils.build_suggest_data(result, relation_fields, result.category[0][1]);
    result           = import_utils.clean_result_data(result, relation_fields);

    if (result.images )
    {
        count++;
        console.log(count)
    }

    return {
        converted_item : result,
        suggest_data
    }
};

module.exports = {
    convert,
    custom_save_to_db: save_fn.custom_save_to_db.bind(null, export_version, convert),
    version: export_version,
    // disable: true
};