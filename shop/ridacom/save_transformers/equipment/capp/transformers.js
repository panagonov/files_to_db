let fs                 = require("fs");
let utils              = require("../../../../../_utils/utils.js");
let import_utils       = require("../../../../_utils/save_utils.js");
let category_map       = require("./category_map.json");

let missing_categories = [];

let enrich = {
    pipette            : require("./pipette.js"),
    centrifuge         : require("./centrifuge.js"),
    micro_centrifuge   : require("./centrifuge.js"),
    clinical_centrifuge: require("./centrifuge.js"),
    centrifuge_tubes   : require("./centrifuge_tubes.js"),
    balance            : require("./balance.js")
};

let get_images = record =>
{
    let crawler_item = record.crawler_item;
    if(crawler_item.image)
    {
        return [{
            link: crawler_item.image,
            type: "product",
            ...crawler_item.image_text ? {text: crawler_item.image_text.map(text => text.replace(/\s+/g, " ").trim())} : ""
        }]
    }

    return null
};

let get_pdf = record =>
{
    let crawler_item = record.crawler_item;
    return crawler_item.pdf ? crawler_item.pdf : null;
};

let get_price_model = record =>
{
    let crawler_item = record.crawler_item;
    let sub_products = Object.keys(crawler_item.sub_products || {}).filter(it => crawler_item.sub_products[it] !== undefined);

    let result = {
        ...sub_products &&sub_products.length ? {"is_multiple" : true} : "",
        ...sub_products &&sub_products.length ? {"is_ids_are_unique" : true} : "",
        search_price : record.price ? record.price[0].value : 0,
        "variation" :[{
            "price" : {
                "value"   : record.price ? record.price[0].value || 0 : 0,
                "currency": record.price ? record.price[0].currency || "usd" : "usd",
            },
            "product_id": record.oid
        }]
    };

    return result;
};

let get_product_relations = record => {
    let sub_products = Object.keys(record.crawler_item.sub_products || {})
    .filter(id => id !== record.oid);

    let result = sub_products.map(id => `PRODUCT_SOURCE:[CAPP]_SUPPLIER:[RIDACOM]_ID:[${id}]`);
    return result
};

let get_category = record =>
{
    let crawler_item = record.crawler_item;
    let category = "";
    let categories = [crawler_item.sub_sub_category, crawler_item.sub_category, crawler_item.category].filter(item => item);
    for(let i = (categories || []).length - 1; i >= 0; i--)
    {
        let cat_name = categories[i].toLowerCase();
        if (category_map[cat_name]) {
            category = category_map[cat_name];
            break;
        }
    }

    let result = import_utils.get_canonical(category.replace(/_/g, " "), ":product_category");

    if (!result.length){
        // debugger
        result = import_utils.get_canonical("lab equipment", ":product_category");
        if (categories.length)
        {
            missing_categories.push(categories.join("/"));
            fs.writeFileSync(__dirname + "/missing_cat.json", JSON.stringify(utils.uniq(missing_categories)));
        }
    }
    return result;
};

let get_additional_category_data = (record, result) => {
    if (! result.category)
        return {};
    try {
        let category = result.category[0][1];

        if (enrich[category])
        {
            let new_data = enrich[category](record, result);
            return  Object.assign(result, new_data)
        }
    }
    catch(e){}
    return {}
};

module.exports = {
    get_images,
    get_pdf,
    get_price_model,
    get_product_relations,
    get_category,
    get_additional_category_data,
};