let utils        = require("../../../../_utils/utils.js");
let import_utils = require("../../../_utils/save_utils.js");
let transformers = require("./cloud_clone/transformers.js");

let relation_fields = ["host", "reactivity", "application", "isotype", "light_chain", "heavy_chain", "clonality", "research_area", "supplier", "distributor", "category"];

let mapping = {
    "name"               : "name",
    "oid"                : "oid",
    "description"        : "description",
    "clone_id"           : "clone_num",
    "usage"              : "usage",
    "shelf_life"         : "shelf_life",
    "storage_conditions" : "storage_conditions",
    "delivery_conditions": "delivery_conditions",
    "buffer_form"        : "buffer_form",
    "immunogen"          : "immunogen",
    "original_link"      : "link",
    "human_readable_id"  : record => `cloud_clone_${import_utils.human_readable_id(record.name, record.oid)}`,
    "external_links"     : record => [{"key": "cloud_clone", "id": record.oid}],
    "supplier"           : record => import_utils.get_canonical("Cloud-Clone Corp.", ":supplier"),
    "distributor"        : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "host"               : record => import_utils.get_canonical(record.host || "", [":host", ":reactivity"]),
    "reactivity"         : record => import_utils.get_canonical(record.reactivity.join("; "), [":host", ":reactivity"]),
    "application"        : record => import_utils.get_canonical(record.application.join("; "), ":application"),
    "isotype"            : record => import_utils.get_canonical(record.isotype || "", ":isotype"),
    "light_chain"        : record => import_utils.get_canonical(record.isotype || "", ":light_chain"),
    "heavy_chain"        : record => import_utils.get_canonical(record.isotype || "", ":heavy_chain"),
    "clonality"          : record => import_utils.get_canonical(record.source || "", ":clonality"),
    "research_area"      : record => import_utils.get_canonical((record.research_area || []).join("; ") || "", ":research_area"),
    "concentration"      : record => record["concentration"] ?import_utils.size_parser(record.concentration) : null,
    "bio_object"         : transformers.get_bio_object,
    "price_model"        : transformers.get_price_model,
    "images"             : transformers.get_images,
    "pdf"                : transformers.get_pdf,
    "category"           : transformers.get_category,
    "distributor_only" : record => ({
        "price" : record.supplier_specific.price
    })
};

let convert = (item, crawler_item) =>
{
    let record = Object.assign({}, item, {crawler_item: crawler_item});

    let result = utils.mapping_transform(mapping, record);
    let service_data = import_utils.build_service_data(result, relation_fields);
    result = Object.assign(result, service_data);

    let suggest_data = import_utils.build_suggest_data(result, relation_fields,  result.category[0][1]);
    result           = import_utils.clean_result_data(result, relation_fields);

    return {
        converted_item : result,
        suggest_data
    }
};

module.exports = {
    convert,
    version: 2
};
