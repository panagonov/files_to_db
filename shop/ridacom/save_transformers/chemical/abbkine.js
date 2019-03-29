let utils        = require("../../../../_utils/utils.js");
let import_utils = require("../../../_utils/save_utils.js");

let relation_fields = ["supplier", "distributor", "application", "category", "preparation_method"];

let _getImages = item => {
    let result = null;

    if(item.images && item.images.length)
    {
        result = item.images.map((link, index) => {
            let text = item.images_text && item.images_text[index] ? item.images_text[index] : "";
            text = text.replace(/\s+/g, " ").trim();
            return {
                link: link,
                ...text ? {text: [text]} : ""
            }
        })
    }

    return result
};

let _getPdf = item =>
{
    let result = null;

    if(item.pdf)
    {
        result =[{link: item.pdf}]
    }

    return result;
};

let _getPriceModel = (item, crawler_item) =>
{
    let result = {
        ...item.price && item.price.length ? {"is_multiple" : true} : "",
        search_price : item.price ? item.price[0].price : 0,
        "variation" :[]
    };

    (item.price || []).forEach((price_item, index)=>
    {
        let size = import_utils.size_parser(price_item.size);

        result.variation.push({
            "price" : {
                "value"   : price_item.price || 0,
                "currency": "usd",
            },
            "size"    : size
        })
    });

    return result;
};

let mapping = {
    "name"               : "name",
    "oid"                : "oid",
    "human_readable_id"  : record => `abbkine_scientific_co_ltd_${import_utils.human_readable_id(record.name, record.oid)}`,
    "external_links"     : record => {
                                        let result = [{"key": "abbkine", "id": record.oid}];
                                        if (record.cas_number)
                                            result.push({"key": "cas_number", "id": record.cas_number});
                                        return result;
                           },
    "description"        : record => record["background"] ? [record["background"]] : null,
    "price_model"        : record => _getPriceModel(record, record.crawler_item),
    "supplier"           : record => import_utils.get_canonical("Abbkine Scientific Co., Ltd.", ":supplier"),
    "distributor"        : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "category"           : record => import_utils.get_canonical("Chemical", ":product_category"),
    "application"        : record => import_utils.get_canonical((record.application || []).join("; "), ":application"),
    "images"             : record =>  _getImages(record.crawler_item),
    "pdf"                : record =>  _getPdf(record.crawler_item),
    "formulation"        : "formulation",
    "usage"              : "usage_notes",
    "storage_conditions" : "storage_instructions",
    "delivery_conditions": "shipping",
    "molecular_weight"   : record => !record["mol_weight"] ? null : import_utils.size_parser(record["mol_weight"]),
    "purification"       : "purification",
    "purity"             : "purity",
    "preparation_method" : record => import_utils.get_canonical(record.host || "", [":host", ":reactivity", ":preparation_method"]),
    "formula"            : "formula",
    "features"           : "features",
    "storage_buffer"     : "storage_buffer",
    "precautions"        : "precautions",
    "aliases"            : "alternative",
    "original_link"      : record => record.crawler_item && record.crawler_item.url ? record.crawler_item.url : null,
    "app_notes"          : "app_notes"
};

let convert = (item, crawler_item) =>
{
    let record = Object.assign({}, item, {crawler_item: crawler_item});

    let result = utils.mapping_transform(mapping, record);
    let service_data = import_utils.build_service_data(result, relation_fields);
    result = Object.assign(result, service_data);

    let suggest_data = import_utils.build_suggest_data(result, relation_fields, "chemical");
    result           = import_utils.clean_result_data(result, relation_fields);

    return {
        converted_item : result,
        suggest_data,
    }
};

module.exports = {
    convert,
    version: 15
};