let utils        = require("../../../../_utils/utils.js");
let import_utils = require("../../../_utils/save_utils.js");

let relation_fields = ["host", "clonality", "supplier", "distributor"];

let _getImages = item =>
{
    let result = null;

    if(item.image && item.image.length)
    {
        result = item.image.map((img_data, index) =>{
            let img_text = item.img_text instanceof Array ? item.img_text[index] || ""  : index === 0 ? item.img_text || "" : "";
            return {
                link: img_data.link.replace("../../", "/"),
                ...img_data.thumb ? {thumb_link: img_data.thumb.replace("../../", "/")} : "",
                ...img_text       ? {text: img_text.replace(/\s+/g, " ").trim()} : ""
            }
        })
    }

    return result
};

let _getPdf = item =>
{
    let result = null;
    if(item.pdf && item.pdf.length)
    {
        result = item.pdf.map(item => {
            item.link = item.link.replace("../../", "/");
            return item;
        })
    }

    return result;
};

let _getPriceModel = (item, crawler_item) =>
{
    let result = {
        ...item.price && item.price.length ? {"is_multiple" : true} : "",
        "variation" :[]
    };

    let search_price = 0;
    if (item.price) {
        search_price = item.price[0].price;
    }

    search_price ? result.search_price = search_price : null;

    (item.price || []).forEach((price_item, index )=>
    {
        let product_id =  `${item.oid}-`;
        let end_of_id = /^[\d|\.]+/.exec(price_item.size)[0];
        if (end_of_id === "0.1")
            end_of_id = "100";

        let size = import_utils.size_parser(price_item.size);

        result.variation.push({
            "price" : {
                "value"   : price_item.price || 0,
                "currency": "usd"
            },
            "product_id" : product_id + end_of_id,
            "size"       : size
        })
    });

    return result;
};

let mapping = {
    "name"               : "name",
    "oid"                : "oid",
    "human_readable_id"  : record => `genomeme_${import_utils.human_readable_id(record.name)}_${record.oid}`,
    "external_links"     : record => [{"key": "genomeme", "id": record.oid}],
    "bio_object"         : record => [{
        "type": "protein",
        ...record.name ? {"name": record.name} : ""
    }],
    "price_model"        : record => _getPriceModel(record, record.crawler_item),
    "description"        : "crawler_item.description",
    "supplier"           : record => import_utils.get_canonical("GenomeMe", ":supplier"),
    "distributor"        : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "host"               : record => import_utils.get_canonical(record.crawler_item.host || "", [":host", ":reactivity"]),
    "clonality"          : record => import_utils.get_canonical(record.crawler_item.host || "", ":clonality"),
    "images"             : record =>  _getImages(record.crawler_item),
    "pdf"                : record =>  _getPdf(record.crawler_item),
    "original_link"      : record => record.crawler_item && record.crawler_item.url ? record.crawler_item.url : null,
    "supplier_specific"  : record => ({
        ...record.crawler_item && record.crawler_item.positive_control ? {"positive_control" : record.crawler_item.positive_control} : "",
        ...record.crawler_item && record.crawler_item.range ? {"dilution_range"  : record.crawler_item.range} : ""
    })
};

let convert = (item, crawler_item) =>
{
    let record = Object.assign({}, item, {crawler_item: crawler_item});

    let result = utils.mapping_transform(mapping, record);
    let service_data = import_utils.build_service_data(result, relation_fields);
    result = Object.assign(result, service_data);

    let suggest_data = import_utils.build_suggest_data_antibody_elisa_kit(result, relation_fields, "antibody");

    relation_fields.forEach(name => delete result[name]);

    return {
        converted_item : result,
        suggest_data
    }
};

module.exports = {
    convert,
    version: 7
};