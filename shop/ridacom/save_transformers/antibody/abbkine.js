let utils            = require("../../../../_utils/utils.js");
let import_utils     = require("../../../_utils/save_utils.js");
let bio_object_utils = require("../../../_utils/bio_object_utils.js");
let transformers     = require("./abbkine/transformers.js");

let relation_fields = ["category", "host", "reactivity", "application", "isotype", "light_chain", "heavy_chain", "clonality", "research_area", "supplier", "distributor", "conjugate"];

let init = async() =>
{
    await bio_object_utils.init()
};

let mapping = {
    "name"                  : "name",
    "oid"                   : "oid",
    "storage_conditions"    : "storage_instructions",
    "delivery_conditions"   : "shipping",
    "buffer_form"           : "storage_buffer",
    "immunogen"             : "immunogen",
    "purification"          : "purification",
    "formulation"           : "formulation",
    "original_link"         : "link",
    "precautions"           : "precautions",
    "alternative"           : "alternative",
    "accession"             : "accession",
    "accession_link"        : "accession_link",
    "gene_id"               : "gene_id",
    "human_readable_id"     : record => `abbkine_scientific_co_ltd_${import_utils.human_readable_id(record.name, record.oid)}`,
    "external_links"        : record => [{"key": "abbkine_scientific_co_ltd", "id": record.oid}],
    "description"           : record => record["description"] ? [record["description"]] : null,
    "usage"                 : record => record["background"] && record["background"].trim() ? [record["background"].replace(/\s+/g, " ").trim()] : null,
    "supplier"              : record => import_utils.get_canonical("Abbkine Scientific Co., Ltd.", ":supplier"),
    "distributor"           : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "host"                  : record => import_utils.get_canonical(record.host || "", [":host", ":reactivity"]),
    "reactivity"            : record => import_utils.get_canonical((record.reactivity || []).join("; "), [":host", ":reactivity"]),
    "application"           : record => import_utils.get_canonical((record.application || []).join("; "), ":application"),
    "isotype"               : record => import_utils.get_canonical(record.isotype || "", ":isotype"),
    "light_chain"           : record => import_utils.get_canonical(record.isotype || "", ":light_chain"),
    "heavy_chain"           : record => import_utils.get_canonical(record.isotype || "", ":heavy_chain"),
    "clonality"             : record => import_utils.get_canonical(record.clonality || "", ":clonality"),
    "conjugate"             : record => import_utils.get_canonical(record.conjugate || "", [":conjugate", ":reactivity"]),
    "category"              : transformers.get_category,
    "bio_object"            : transformers.get_bio_object,
    "price_model"           : transformers.get_price_model,
    "images"                : transformers.get_images,
    "pdf"                   : transformers.get_pdf,
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
    version: 2
};