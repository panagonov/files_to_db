let utils        = require("../../../../_utils/utils.js");
let import_utils = require("../../../_utils/save_utils.js");
let transformers = require("./adam_equipment/transformers.js");
let id_fixes_map = require("./adam_equipment/id_mapping.json");

let relation_fields = ["supplier", "distributor", "category", "sub_category", "calibration"];

let mapping = {
    "name"                   : "name",
    "oid"                    : "oid",
    "original_link"          : "crawler_item.link",
    "human_readable_id"      : record => `adam_equipment_${import_utils.human_readable_id(record.name, record.oid)}`,
    "external_links"         : record => [{"key": "adam_equipment", "id": record.oid}],
    "supplier"               : record => import_utils.get_canonical("Adam Equipment", ":supplier"),
    "distributor"            : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "product_relations"      : record => record.crawler_item && record.crawler_item["accessories"] ? record.crawler_item["accessories"].map(id => `PRODUCT_SOURCE:[ADAM_EQUIPMENT]_SUPPLIER:[RIDACOM]_ID:[${id}]`) : null,
    "product_relations_count": record => record.crawler_item && record.crawler_item["accessories"] ? record.crawler_item["accessories"].length : null,
    "price_model"            : transformers.get_price_model,
    "description"            : transformers.get_description,
    "sub_category"           : transformers.get_sub_category,
    "pdf"                    : transformers.get_pdf,
    "images"                 : transformers.get_images,
    "videos"                 : transformers.get_videos,
    "other_info"             : transformers.get_other_info,
    "category"               : transformers.get_category,
};

let index = 0;
let show_in_console = (result, crawler_item, record) =>
{
    console.table({
        index                : index,
        name                 : result.name,
        category             : (result.category || []).toString(),
        sub_category         : (result.sub_category || []).toString(),
        capacity             : JSON.stringify(result.capacity),
        calibration          : JSON.stringify(result.calibration),
        readability          : JSON.stringify(result.readability),
        operating_temperature: JSON.stringify(result.operating_temperature),
        specs                : crawler_item && crawler_item.specifications ? Object.keys(crawler_item.specifications).toString() : "",
        oid                  : result.oid,
        craw_id              : crawler_item  ? crawler_item.oid || crawler_item._id : ""
    });

    if (index >= 500) debugger;
    index++;
};

let convert = (item, crawler_item) =>
{
    let record = Object.assign({}, item, {crawler_item: crawler_item || {}});

    let result = utils.mapping_transform(mapping, record);
    let additional_data = transformers.get_additional_category_data(record, result);
    result = Object.assign(result, additional_data);

    let service_data = import_utils.build_service_data(result, relation_fields);
    result = Object.assign(result, service_data);

    // show_in_console(result, crawler_item, record);

    let suggest_data = import_utils.build_suggest_data(result, relation_fields, result.category[0][1]);
    result           = import_utils.clean_result_data(result, relation_fields);


    return {
        converted_item : result,
        suggest_data,
    }
};

let get_crawler_ids = items => items.map(({oid}) => id_fixes_map[oid] || oid);

let get_crawler_item = (item, crawler_hash) =>  crawler_hash[id_fixes_map[item.oid] || item.oid];

module.exports = {
    convert,
    version: 2,
    get_crawler_ids,
    get_crawler_item
};