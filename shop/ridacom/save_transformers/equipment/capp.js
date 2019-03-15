let utils        = require("../../../../_utils/utils.js");
let import_utils = require("../../../_utils/save_utils.js");

let relation_fields = ["supplier", "distributor", "category", "sub_category", "sub_sub_category", "categories"];

let enrich = {
    pipette         : require("./capp/pipette.js"),
    centrifuge      : require("./capp/centrifuge.js"),
    centrifuge_tubes: require("./capp/centrifuge_tubes.js")
};

let fixator = require("./capp/fixator.js");

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

    return result;
};

let _getProductRelations = record => {
    let sub_products = Object.keys(record.crawler_item.sub_products || {})
    .filter(id => id !== record.oid);

    let result = sub_products.map(id => `PRODUCT_SOURCE:[CAPP]_SUPPLIER:[RIDACOM]_ID:[${id}]`)
    return result
}

let get_additional_category_data = (record, result) => {
    if (! result.category_relations)
        return {};

    let category = result.category_relations[0];

    if (enrich[category])
    {
        let new_data = enrich[category](record, result);
        return  Object.assign(result, new_data)
    }
    return {}
};

let mapping = {
    "name"                : "name",
    "oid"                 : "oid",
    "human_readable_id"   : record => `capp_${import_utils.human_readable_id(record.name)}_${record.oid}`,
    "external_links"      : record => [{"key": "capp", "id": record.oid}],
    "price_model"         : record => _getPriceModel(record, record.crawler_item),
    "supplier"            : record => import_utils.get_canonical("CAPP", ":supplier"),
    "category"            : record => import_utils.get_canonical(record.crawler_item.category || "equipment", ":product_category"),
    "sub_category"        : record => import_utils.get_canonical(record.crawler_item.sub_category || "", ":product_sub_category"),
    // "sub_sub_category"    : record => import_utils.get_canonical(record.crawler_item.sub_sub_category || "", ":product_sub_sub_category"),
    "distributor"         : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "description"         : record => record.crawler_item && record.crawler_item.description ? [record.crawler_item.description] : null,
    "table_specification" : "crawler_item.specification",
    "product_relations"   : record => _getProductRelations(record),
    "images"              : record => _getImages(record.crawler_item),
    "pdf"                 : record => _getPdf(record.crawler_item),
    "original_link"       : "crawler_item.link"
};

let index = 0;
let show_in_console = (result, crawler_item1, record) =>
{
    console.table({
        index : index,
        name        : result.name,
        category    : (result.category_relations || []).toString(),
        sub_category: (result.sub_category_relations || []).toString(),
        volume      : JSON.stringify(result.volume),
        r_category  : crawler_item1 ? crawler_item1.category : "",
        r_s_category  : crawler_item1 ? crawler_item1.sub_category : "",
        r_s_s_category  : crawler_item1 ? crawler_item1.sub_sub_category : ""
    });

    if (index > 293)
        debugger;
    index++;
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
    result = fixator(result, record);

    let service_data = import_utils.build_service_data(result, relation_fields);
    result = Object.assign(result, service_data);

    let additional_data = get_additional_category_data(record, result);
    result = Object.assign(result, additional_data);

    // show_in_console(result, crawler_item1, record);

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
    version: 2
};

// console.log(import_utils.get_canonical("other benchtop", ":product_sub_category"))