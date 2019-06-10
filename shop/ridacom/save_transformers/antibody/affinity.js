let utils            = require("../../../../_utils/utils.js");
let import_utils     = require("../../../_utils/save_utils.js");
let bio_object_utils = require("../../../_utils/bio_object_utils.js");
let transformers     = require("./affinity/transformers.js");

let relation_fields = ["category", "host", "reactivity", "application", "isotype", "light_chain", "heavy_chain", "clonality", "research_area", "supplier", "distributor", "conjugate"];

let init = async() =>
{
    await bio_object_utils.init()
};

let mapping = {
    "name"                  : "name",
    "oid"                   : "oid",
    "buffer_form"           : "buffer_form",
    "original_link"         : "link",
    "purification"          : "purification",
    "concentration"         : "concentration",
    "specificity"           : "specificity",
    "storage_buffer"        : "storage_buffer",
    "images"                : "crawler_item.images",
    "human_readable_id"     : record => `affinity_biosciences_${import_utils.human_readable_id(record.name, record.oid)}`,
    "supplier"              : record => import_utils.get_canonical("Affinity Biosciences", ":supplier"),
    "distributor"           : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "application"           : record => import_utils.get_canonical((record.application || []).join("; "), ":application"),
    "clonality"             : record => import_utils.get_canonical(record.clonality || "", ":clonality"),
    "host"                  : record => import_utils.get_canonical(record.host || "", [":host", ":reactivity"]),
    "isotype"               : record => import_utils.get_canonical(record.isotype || "", ":isotype"),
    "reactivity"            : record => import_utils.get_canonical((record.reactivity || []).join("; "), [":host", ":reactivity"]),
    "external_links"        : record => [{"key": "affinity_biosciences", "id": record.oid}],
    "description"           : record => record.crawler_item["Background"] && record.crawler_item["Background"]["Function"]  ? [record.crawler_item["Background"]["Function"]] : null,
    "precautions"           : record => record.crawler_item["tab_blocking"] && record.crawler_item["tab_blocking"]["Precautions"]  ? [record.crawler_item["tab_blocking"]["Precautions"]] : null,
    "aliases"               : record => record.crawler_item["Product Information"] && record.crawler_item["Product Information"]["Alternative Names"]  ? record.crawler_item["Product Information"]["Alternative Names"] : null,
    "storage_conditions"    : record => record.crawler_item["Product Information"] && record.crawler_item["Product Information"]["Storage Condition and Buffer"]  ? record.crawler_item["Product Information"]["Storage Condition and Buffer"] : null,
    "price_model"           : transformers.get_price_model,
    "pdf"                   : transformers.get_pdf,
    "category"              : transformers.get_category,
    "unclassified_fields"   : transformers.get_unclassified_fields,
    "bio_object"            : transformers.get_bio_object,
};

let _get_bio_object_data = (crawler_item, custom_data) =>
{
    let bio_id = crawler_item["Immunogen Information"] && crawler_item["Immunogen Information"]["Uniprot"] && crawler_item["Immunogen Information"]["Uniprot"][0] ? crawler_item["Immunogen Information"]["Uniprot"][0].link.split("/").pop() : null;
    let missing_data = [];
    if (!bio_id)
        return {bio_object_data: [], missing_data};

    let bio_object_data = [bio_id].reduce((res,id) => {
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
    let {bio_object_data, missing_data} = _get_bio_object_data(crawler_item, custom_data);

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

let load_custom_data = async(mongo_db, crawler_db, result, crawler_hash) => {

    let ids = utils.uniq(
        Object.keys(crawler_hash)
        .map(name => crawler_hash[name]["Immunogen Information"] && crawler_hash[name]["Immunogen Information"]["Uniprot"] && crawler_hash[name]["Immunogen Information"]["Uniprot"][0] ? crawler_hash[name]["Immunogen Information"]["Uniprot"][0].link.split("/").pop() : null)
        .filter(item => item)
    );

    let {hash, duplicated} = await bio_object_utils.find_bio_objects(ids);

    return {result: hash, error: duplicated.length ? duplicated : null};
};


module.exports = {
    load_custom_data,
    convert,
    init,
    version: 6
};