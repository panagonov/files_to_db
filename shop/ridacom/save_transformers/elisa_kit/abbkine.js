let utils            = require("../../../../_utils/utils.js");
let import_utils     = require("../../../_utils/save_utils.js");
let bio_object_utils = require("../../../_utils/bio_object_utils.js");
let transformers     = require("./abbkine/transformers.js");

let relation_fields = ["category", "reactivity", "conjugate", "test_method", "supplier", "distributor"];

let init = async() =>
{
    await bio_object_utils.init()
};

let mapping = {
    "name"               : "name",
    "oid"                : "oid",
    "original_link"      : "link",
    "formulation"        : "formulation",
    "usage"              : "usage_notes",
    "storage_conditions" : "storage_instructions",
    "delivery_conditions": "shipping",
    "alternative"        : "alternative",
    "precautions"        : "precautions",
    "gene_id"            : "gene_id",
    "sensitivity"        : "limit_of_detection",
    "sample_type"        : "sample_type",
    "assay_length"       : "assay_duration",
    "kit_components"     : "kit_components",
    "human_readable_id"  : record => `abbkine_scientific_co_ltd_${import_utils.human_readable_id(record.name, record.oid)}`,
    "external_links"     : record => [{"key": "abbkine", "id": record.oid}],
    "description"        : record => record["background"] ? [record["background"]] : null,
    "supplier"           : record => import_utils.get_canonical("Abbkine Scientific Co., Ltd.", ":supplier"),
    "distributor"        : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "conjugate"          : record => import_utils.get_canonical(record.conjugate || "", [":conjugate", ":reactivity"]),
    "test_method"        : record => import_utils.get_canonical(record.detection_method || "", ":test_method"),
    "category"           : transformers.get_category,
    "bio_object"         : transformers.get_bio_object,
    "price_model"        : transformers.get_price_model,
    "images"             : transformers.get_images,
    "pdf"                : transformers.get_pdf,
    "calibration_range"  : transformers.get_calibration_range,
};

let _get_bio_object_data = (item, custom_data) =>
{
    let bio_ids = (item.accession || "").split("/").map(it => it.trim().split("-").shift());
    let missing_data = [];

    let bio_object_data = bio_ids.reduce((res,id) => {
        if (!custom_data[id])
            missing_data.push(id);
        else
            res.push(custom_data[id]);

        return res
    }, []);

    return {bio_object_data, missing_data}
};

let convert = (item, crawler_item, custom_data) =>
{
    let {bio_object_data, missing_data} = _get_bio_object_data(item, custom_data);

    let record = Object.assign({}, item, {crawler_item: crawler_item, bio_object_data : bio_object_data});

    let result = utils.mapping_transform(mapping, record);
    let service_data = import_utils.build_service_data(result, relation_fields);
    result = Object.assign(result, service_data);

    let suggest_data = import_utils.build_suggest_data(result, relation_fields, result.category[0][1]);
    result           = import_utils.clean_result_data(result, relation_fields);

    return {
        converted_item : result,
        suggest_data,
        ...missing_data.length ? {missing_data: missing_data} : ""
    }
};

let load_custom_data = async(mongo_db, crawler_db, result) => {
    let ids = utils.uniq(result
        .map(item => item.accession)
        .filter(id => id)
        .reduce((res, id) => {
            res = res.concat(id.split("/"));
            res = res.map(it => it.trim().split("-").shift());
            return res
        }, [])
    );

    let {hash, duplicated} = await bio_object_utils.find_bio_objects(ids);

    return {result: hash, error: duplicated.length ? duplicated : null};
};

module.exports = {
    convert,
    load_custom_data,
    init,
    version: 32
};