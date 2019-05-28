let utils            = require("../../../../_utils/utils.js");
let import_utils     = require("../../../_utils/save_utils.js");
let bio_object_utils = require("../../../_utils/bio_object_utils.js");
let transformers     = require("./abbkine/transformers.js");

let relation_fields = ["supplier", "distributor", "preparation_method", "category"];

let init = async() =>
{
    await bio_object_utils.init()
};

let mapping = {
    "name"                  : "name",
    "oid"                   : "oid",
    "original_link"         : "link",
    "sequence"              : "sequence",
    "activity"              : "activity",
    "protein_length"        : "protein_length",
    "purity"                : "purity",
    "formulation"           : "formulation",
    "usage"                 : "usage_notes",
    "storage_conditions"    : "storage_instructions",
    "delivery_conditions"   : "shipping",
    "aliases"               : "alternative",
    "precautions"           : "precautions",
    "gene_id"               : "gene_id",
    "others"                : "others",
    "human_readable_id"     : record => `abbkine_scientific_co_ltd_${import_utils.human_readable_id(record.name, record.oid)}`,
    "external_links"        : record => [{"key": "abbkine_scientific_co_ltd", "id": record.oid}],
    "description"           : record => record["background"] ? [record["background"]] : null,
    "molecular_weight"      : record => !record["mol_weight"] ? null : import_utils.size_parser(record["mol_weight"]),
    "supplier"              : record => import_utils.get_canonical("Abbkine Scientific Co., Ltd.", ":supplier"),
    "distributor"           : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "category"              : record => import_utils.get_canonical("Protein", ":product_category"),
    "preparation_method"    : record => import_utils.get_canonical(record.preparation_method, [":host", ":reactivity", ":preparation_method"]),
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

    let {hash, duplicated} = await bio_object_utils.find_bio_objects(result);

    return {
        result: hash,
        ...duplicated.length ? {error: duplicated} : ""
    };
};

module.exports = {
    convert,
    load_custom_data,
    init,
    version: 31
};