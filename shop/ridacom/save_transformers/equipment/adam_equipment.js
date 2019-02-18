let utils              = require("../../../../_utils/utils.js");
let import_utils       = require("../../../_utils/save_utils.js");
let country_utils      = require("../../../../common-components/region_utils/country_utils.js");
let currency_converter = require("../../../../common-components/region_utils/currency_converter.js");

let relation_fields = ["supplier", "distributor", "product_category", "product_sub_category"];

let _getPdf = item =>
{
    if (item.pdf) {
        return item.pdf.map(item => {
            if (["Multi-Language", "Multi_Language"].indexOf(item.lang) !== -1)
                delete item.lang
            else if (item.lang) {
                let lang = country_utils.getLangByLangugageName(item.lang);
                if (lang)
                {
                    item.lang = lang
                }
            }
            return item
        })
    }
    return null;
};

let _getPriceModel = (item, crawler_item) =>
{
    let result = {
        "is_multiple"      : false,
        "is_ids_are_unique": false,
        "search_price"     : item.price ? currency_converter.convert_currency(item.price.currency, "usd", item.price.value) : 0,
        "variation"        : [{
            "price": {
                "value"   : item.price ? item.price.value || 0 : 0,
                "currency": item.price ? item.price.currency || "eur" : "eur"
            }
        }]
    };
    return result;
};

let _get_sub_category = (item, crawler_item) => {
    if (item.accessories)
        return import_utils.get_canonical("Accessories", ":product_sub_category");

    let sub_categories = utils.uniq((crawler_item.parent_sub_category || crawler_item.sub_category || []).filter(item => item !== crawler_item._id));
    return import_utils.get_canonical(sub_categories[0] || "", ":product_sub_category")
};

let _get_specification = (item) =>
{
    let crawler_item = item.crawler_item;
    let specifications = crawler_item ? crawler_item["specifications"] : null;
    if (specifications)
    {
        return Object.keys(specifications).map(key => ({key, value: specifications[key] instanceof Array ? specifications[key] : [specifications[key]]}))
    }

    return null;
};

let _getVideos = (crawler_item) =>
{
    if (!crawler_item.videos || !crawler_item.videos.length)
        return null;

    let result = crawler_item.videos.filter(url => url !== "/blank.html").map(url => ({
        link: url
    }));

    return result.length ? result : null
};

let _get_description = (item) =>
{
    if (item.crawler_item)
    {
        let crawler_item = item.crawler_item;
        let description = crawler_item.description;
        if (description instanceof Array)
            return description;
        else if (description)
            return [description];
    }
    return null
};

let _get_other_info = (crawler_item) =>
{
    let result = [];
    let type = "features";
    if (crawler_item.features) {
        result = Object.keys(crawler_item.features).map(key => ({key: key, type: type, value: crawler_item.features[key]}))
    }

    if (crawler_item.technical_highlights_or_applications && crawler_item.technical_highlights_or_applications.length)
    {
        type = crawler_item.technical_highlights ? "application" : "technical_highlights";
        result.push({key: type, type: type, value: crawler_item.technical_highlights_or_applications.filter(item => item)})
    }

    if (crawler_item.technical_highlights && crawler_item.technical_highlights.length){
        type = "technical_highlights";
        result.push({key: type, type: type, value: crawler_item.technical_highlights.filter(item => item)})
    }


    return result.length ? result : null
};

let mapping = {
    "name"                   : "name",
    "oid"                    : "oid",
    "human_readable_id"      : record => import_utils.human_readable_id(record.name) + "_" + record.oid,
    "external_links"         : record => [{"key": "capp", "id": record.oid}],
    "price_model"            : record => _getPriceModel(record, record.crawler_item),
    "supplier"               : record => import_utils.get_canonical("Adam Equipment", ":supplier"),
    "distributor"            : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "product_category"       : record => import_utils.get_canonical("Balance", ":product_category"),
    "product_sub_category"   : record => _get_sub_category(record, record.crawler_item),
    "description"            : _get_description,
    "other_info"             : record => _get_other_info(record.crawler_item),
    "images"                 : "crawler_item.images",
    "videos"                 : record => _getVideos(record.crawler_item),
    "product_relations"      : record => record.crawler_item && record.crawler_item["accessories"] ? record.crawler_item["accessories"].map(id => `PRODUCT_SOURCE:[ADAM_EQUIPMENT]_SUPPLIER:[RIDACOM]_ID:[${id}]`) : null,
    "product_relations_count": record => record.crawler_item && record.crawler_item["accessories"] ? record.crawler_item["accessories"].length : null,
    "specification"          : _get_specification,
    "pdf"                    : record => _getPdf(record.crawler_item),
    "original_link"          : "crawler_item.link"
};

let convert = (item, crawler_item) =>
{
    let record = Object.assign({}, item, {crawler_item: crawler_item || {}});

    let result = utils.mapping_transform(mapping, record);
    let service_data = import_utils.build_service_data(result, relation_fields);
    result = Object.assign(result, service_data);

    let suggest_data = import_utils.build_suggest_data_antibody_elisa_kit(result, relation_fields, "equipment");

    relation_fields.forEach(name => delete result[name]);

    return {
        converted_item : result,
        suggest_data,
    }
};

module.exports = {
    convert,
    version: 1
};