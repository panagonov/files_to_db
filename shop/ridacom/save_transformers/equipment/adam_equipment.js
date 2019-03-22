let utils              = require("../../../../_utils/utils.js");
let import_utils       = require("../../../_utils/save_utils.js");
let country_utils      = require("../../../../common-components/region_utils/country_utils.js");
let currency_converter = require("../../../../common-components/region_utils/currency_converter.js");
let id_fixes_map       = require("./adam_aquipment/id_mapping.json");

let relation_fields = ["supplier", "distributor", "category", "sub_category", "calibration"];

let enrich = {
    balance         : require("./adam_aquipment/balance.js")
};

let fixator = require("./adam_aquipment/fixator.js");

let _getPdf = item =>
{
    if (item.pdf) {
        return item.pdf.map(item => {
            if (["Multi-Language", "Multi_Language"].indexOf(item.lang) !== -1)
                delete item.lang;
            else if (item.lang) {
                let lang = country_utils.getLangByLangugageName(item.lang);
                if (lang)
                {
                    item.lang = lang
                }
            }

            if(item.href)
            {
                item.link = item.href;
                delete item.href;
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

let _get_category = (item, crawler_item) => {

    if (item.accessories)
        return import_utils.get_canonical("Accessories", ":product_sub_category");
    else
    {
       return import_utils.get_canonical("Balance", ":product_category")
    }
};

let _get_sub_category = (item, crawler_item) =>
{
    let sub_categories = utils.uniq((crawler_item.parent_sub_category || crawler_item.sub_category || []).filter(item => item !== crawler_item._id));
    if (sub_categories[0])
        return  import_utils.get_canonical(sub_categories[0], ":product_sub_category");
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

let _getImages = (crawler_item) =>
{
    if (!crawler_item.images || !crawler_item.images.length)
        return null;

    return crawler_item.images.map(item => {
        delete item.href;
        return item
    })
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

let get_additional_category_data = (record, result) => {
    if (! result.category)
        return {};

    let category = result.category[0][1];

    if (enrich[category])
    {
        let new_data = enrich[category](record, result);
        return new_data
    }
    return {}
};

let mapping = {
    "name"                   : "name",
    "oid"                    : "oid",
    "human_readable_id"      : record => `adam_equipment_${import_utils.human_readable_id(record.name, record.oid)}`,
    "external_links"         : record => [{"key": "adam_equipment", "id": record.oid}],
    "price_model"            : record => _getPriceModel(record, record.crawler_item),
    "supplier"               : record => import_utils.get_canonical("Adam Equipment", ":supplier"),
    "distributor"            : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "category"               : record => _get_category(record, record.crawler_item),
    "sub_category"           : record => _get_sub_category(record, record.crawler_item),
    "description"            : _get_description,
    "other_info"             : record => _get_other_info(record.crawler_item),
    "images"                 :  record => _getImages(record.crawler_item) ,
    "videos"                 : record => _getVideos(record.crawler_item),
    "product_relations"      : record => record.crawler_item && record.crawler_item["accessories"] ? record.crawler_item["accessories"].map(id => `PRODUCT_SOURCE:[ADAM_EQUIPMENT]_SUPPLIER:[RIDACOM]_ID:[${id}]`) : null,
    "product_relations_count": record => record.crawler_item && record.crawler_item["accessories"] ? record.crawler_item["accessories"].length : null,
    "pdf"                    : record => _getPdf(record.crawler_item),
    "original_link"          : "crawler_item.link"
};

let index = 0;
let show_in_console = (result, crawler_item, record) =>
{
    console.table({
        index                : index,
        name                 : result.name,
        category             : (result.category_relations || []).toString(),
        sub_category         : (result.sub_category_relations || []).toString(),
        capacity             : JSON.stringify(result.capacity),
        calibration_relations: JSON.stringify(result.calibration_relations),
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
    result = fixator(result, record);
    let additional_data = get_additional_category_data(record, result);
    result = Object.assign(result, additional_data);

    let service_data = import_utils.build_service_data(result, relation_fields);
    result = Object.assign(result, service_data);

    // show_in_console(result, crawler_item, record);

    let suggest_data = import_utils.build_suggest_data_antibody_elisa_kit(result, relation_fields, "equipment");
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
    version: 1,
    get_crawler_ids,
    get_crawler_item
};