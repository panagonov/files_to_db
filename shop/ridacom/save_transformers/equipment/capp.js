let utils        = require("../../../../_utils/utils.js");
let import_utils = require("../../../_utils/save_utils.js");

let relation_fields = ["supplier", "distributor", "category", "sub_category", "all_categories"];

let _getImages = item => {

    if(item.image)
    {
        return [{
            link: item.image,
            type: "product",
            ...item.image_text ? {text: item.image_text.map(text => text.replace(/\s+/g, " ").trim())} : ""
        }]
    }

    return null
};

let _getPdf = item =>
{
    return item.pdf ? item.pdf : null;
};

let _getPriceModel = (item, crawler_item) =>
{
    let sub_products = Object.keys(crawler_item.sub_products || {}).filter(it => crawler_item.sub_products[it] !== undefined);

    let result = {
        ...sub_products &&sub_products.length ? {"is_multiple" : true} : "",
        ...sub_products &&sub_products.length ? {"is_ids_are_unique" : true} : "",
        search_price : item.price ? item.price[0].value : 0,
        "variation" :[{
            "price" : {
                "value"   : item.price ? item.price[0].value || 0 : 0,
                "currency": item.price ? item.price[0].currency || "usd" : "usd",
            },
            "product_id": item.oid
        }]
    };

    (sub_products || []).forEach(sub_product_oid =>
    {
        let sub_product = crawler_item.sub_products[sub_product_oid];
        if (!sub_product.price)
            return;
        result.variation.push({
            "price" : {
                "value"   : sub_product.price[0].value || 0,
                "currency": sub_product.price[0].currency || "usd",
            },
            "product_id": sub_product_oid
        })
    });

    return result;
};

let _get_imprecision = crawler_item =>
{
    let result = [];

    if (!crawler_item || !crawler_item.specification || !crawler_item.specification.length)
        return null;

    crawler_item.specification.forEach(data => {
        if (data["imprecision_%"])
        {
            let params = data["imprecision_%"].split("/").map(val => parseFloat(val)).sort((a,b) => a-b);
            result.push({
                "product_id" : data.oid,
                ...params[1] ? {"value_range": {from: params[0], to: params[1]}} : {"value" : params[0]},
                "dimension"  : "%"
            })
        }
    });

    return result.length ? result : null
};


let _get_inaccuracy = crawler_item =>
{
    let result = [];

    if (!crawler_item || !crawler_item.specification || !crawler_item.specification.length)
        return null;

    crawler_item.specification.forEach(data => {

        if (data["inaccuracy_%"])
        {
            let params = data["inaccuracy_%"].split("/").map(val => parseFloat(val)).sort((a,b) => a-b);
            result.push({
                "product_id" : data.oid,
                ...params[1] ? {"value_range": {from: params[0], to: params[1]}} : {"value" : params[0]},
                "dimension" : "%"
            })
        }
    });

    return result.length ? result : null
};

let _get_color = crawler_item =>
{
    let result = [];

    if (!crawler_item || !crawler_item.specification || !crawler_item.specification.length)
        return null;

    crawler_item.specification.forEach(data => {
        if (data["Color"])
        {
            result.push({
                "product_id": data.oid,
                "value"     : data["Color"],
            });
        }
    });

    return result.length ? result : null
};

let _get_channel = crawler_item =>
{
    let result = [];

    if (!crawler_item || !crawler_item.specification || !crawler_item.specification.length)
        return null;

    crawler_item.specification.forEach(data => {
        if (data["name"])
        {
            let value = 0;
            if (data["name"].indexOf("single channel") !== -1)
                value = 1;
            else{
                let match = /(\d+)\-channel/.exec(data["name"]);
                if (match && match[1])
                    value = parseInt(match[1], 10)
            }
            if (value)
            {
                result.push({
                    "product_id": data.oid,
                    "value"     : value,
                });
            }
        }
    });

    return result.length ? result : null
};

let _get_product_relations = crawler_item =>
{
    let result = [];

    if (!crawler_item || !crawler_item.specification || !crawler_item.specification.length)
        return null;

    let cat_with_potential_product_relations = false;

    crawler_item.specification.forEach(data => {

        if (data["imprecision_%"] || data["inaccuracy_%"] || data["Color"])
        {
            cat_with_potential_product_relations = true;
        }
        else if(data["oid"] && cat_with_potential_product_relations)
        {
             result.push(`PRODUCT_SOURCE:[CAPP]_SUPPLIER:[RIDACOM]_ID:[${data["oid"].trim() || ""}]`)
        }
    });

    return result.length ? result : null
};

let mapping = {
    "name"                : "name",
    "oid"                 : "oid",
    "human_readable_id"   : record => `capp_${import_utils.human_readable_id(record.name)}_${record.oid}`,
    "external_links"      : record => [{"key": "capp", "id": record.oid}],
    "price_model"         : record => _getPriceModel(record, record.crawler_item),
    "supplier"            : record => import_utils.get_canonical("CAPP", ":supplier"),
    "category"            : record => import_utils.get_canonical(record.crawler_item.category || "", ":product_category"),
    "sub_category"        : record => import_utils.get_canonical(record.crawler_item.sub_category || "", ":product_sub_category"),
    "distributor"         : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "description"         : record => record.crawler_item && record.crawler_item.description ? [record.crawler_item.description] : null,
    "imprecision"         : record => _get_imprecision(record.crawler_item),
    "inaccuracy"          : record => _get_inaccuracy(record.crawler_item),
    "color"               : record => _get_color(record.crawler_item),
    "channel"             : record => _get_channel(record.crawler_item),
    "product_relations"   : record => _get_product_relations(record.crawler_item),
    "images"              : record => _getImages(record.crawler_item),
    "pdf"                 : record => _getPdf(record.crawler_item),
    "original_link"      : "link",
};

let convert = (item, crawler_item, custom_data) =>
{
    let missing_data =  [];
    let crawler_item1 = custom_data[item.oid];
    if (!crawler_item1 && item.oid.indexOf("-") !== -1){
        let oid = item.oid.split("-");
        oid.pop();
        oid = oid.join("-");
        crawler_item1 = custom_data[oid]
    }
    if (!crawler_item1)
        missing_data = [item.oid];

    let record = Object.assign({}, item, {crawler_item: crawler_item1 || {}});

    let result = utils.mapping_transform(mapping, record);
    let service_data = import_utils.build_service_data(result, relation_fields);
    result = Object.assign(result, service_data);

    let suggest_data = import_utils.build_suggest_data_antibody_elisa_kit(result, relation_fields, "equipment");
    result           = import_utils.clean_result_data(result, relation_fields);

    return {
        converted_item : result,
        suggest_data,
        ...missing_data.length ? {missing_data: missing_data} : ""
    }
};

let load_custom_data = async(mongo_db, crawler_db, result) => {

    let ids = utils.uniq(result
        .map(item => item.oid)
        .filter(id => id)
    );

    let crawler_data = await crawler_db.read("product", {body: {"specification.oid" : {$in : ids}}});

    let product_ids = utils.uniq(crawler_data.reduce((res, item) => {
        (item.specification || []).forEach(({oid}) => res.push(oid));

        return res;
    }, []));

    let products =  await mongo_db.read("product", {body: {"oid" : {$in : product_ids}}});

    let product_hash = products.reduce((res, item) => {
        res[item.oid] = item;
        return res;
    }, {});

    let hash = crawler_data.reduce((res, item) =>
    {
        item.sub_products = (item.specification || []).reduce((sub_res, sub_item) => {
            sub_res[sub_item.oid] = product_hash[sub_item.oid];
            return sub_res
        }, {});

        item.specification.forEach(it => {
            res[it.oid] = item
        });

        return res;
    }, {});


    return {result: hash};
};

module.exports = {
    convert,
    load_custom_data,
    version: 7
};