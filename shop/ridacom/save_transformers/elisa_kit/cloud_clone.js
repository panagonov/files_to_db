let utils        = require("../../../../_utils/utils.js");
let import_utils = require("../../../_utils/save_utils.js");
let transformers = require("./cloud_clone/transformers.js");

let relation_fields = ["category", "reactivity", "application", "test_method", "research_area", "supplier", "distributor"];

let mapping = {
    "name"               : "name",
    "oid"                : "oid",
    "sensitivity"        : "sensitivity",  //str
    "sample_type"        : "sample_type",  //arr
    "assay_length"       : "assay_length",  //str
    "specificity"        : "specificity",  //arr
    "precision"          : "precision",  //arr
    "stability"          : "stability",  //arr
    "procedure"          : "procedure",  //arr
    "original_link"      : "link",
    "shelf_life"         : "shelf_life",
    "storage_conditions" : "storage_conditions",
    "delivery_conditions": "delivery_conditions",
    "human_readable_id"  : record => `cloud_clone_${import_utils.human_readable_id(record.name, record.oid)}`,
    "external_links"     : record => [{"key": "cloud_clone", "id": record.oid}],
    "supplier"           : record => import_utils.get_canonical("Cloud-Clone Corp.", ":supplier"),
    "distributor"        : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "reactivity"         : record => import_utils.get_canonical(record.reactivity.join("; "), [":host", ":reactivity"]),
    "application"        : record => import_utils.get_canonical((record.application || []).join("; "), ":application"),
    "research_area"      : record => import_utils.get_canonical((record.research_area || []).join("; ") || "", ":research_area"),
    "test_method"        : record => import_utils.get_canonical(record.method, ":test_method"),
    "usage"              : record => record["test_principle"] ? [record["test_principle"]] : null,
    "bio_object"         : transformers.get_bio_object,
    "price_model"        : transformers.get_price_model,
    "images"             : transformers.get_images,
    "pdf"                : transformers.get_pdf,
    "category"           : transformers.get_category,
    "distributor_only" : record => ({
        "price" : record.supplier_specific.price
    }),
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
        suggest_data
    }
};

module.exports = {
    convert,
    version: 33
};