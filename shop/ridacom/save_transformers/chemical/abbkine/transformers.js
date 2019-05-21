let fs           = require("fs");
let import_utils = require("../../../../_utils/save_utils.js");
let category_map = require("../../elisa_kit/abbkine/category_map.json");
let utils        = require("../../../../../_utils/utils.js");

let missing_categories = [];

let get_images = record => {
    let crawler_item = record.crawler_item;
    let result = null;

    if(crawler_item.images && crawler_item.images.length)
    {
        result = crawler_item.images.map((link, index) => {
            let text = crawler_item.images_text && crawler_item.images_text[index] ? crawler_item.images_text[index] : "";
            text = text.replace(/\s+/g, " ").trim();
            return {
                link: link,
                ...text ? {text: [text]} : ""
            }
        })
    }

    return result
};

let get_pdf = record =>
{
    let crawler_item = record.crawler_item;
    let result = null;

    if(crawler_item.pdf)
    {
        result =[{link: crawler_item.pdf}]
    }

    return result;
};

let get_price_model = record =>
{
    let result = {
        ...record.price && record.price.length ? {"is_multiple" : true} : "",
        search_price : record.price ? record.price[0].price : 0,
        "variation" :[]
    };

    (record.price || []).forEach(price_item =>
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

let get_external_links = record =>
{
    let result = [{"key": "abbkine", "id": record.oid}];
    if (record.cas_number)
        result.push({"key": "cas_number", "id": record.cas_number});
    return result;
};

let get_category = record =>
{
    let crawler_item = record.crawler_item;
    let category = "";
    for(let i = (crawler_item.categories || []).length - 1; i >= 0; i--)
    {
        let cat_name = crawler_item.categories[i].toLowerCase();
        if (category_map[cat_name]) {
            category = category_map[cat_name];
            break;
        }
    }

    let result = import_utils.get_canonical(category.replace(/_/g, " "), ":product_category");

    if (!result.length){
        result = import_utils.get_canonical("chemicals", ":product_category");
        if (crawler_item.categories)
        {
            missing_categories.push(crawler_item.categories.join("/"));
            fs.writeFileSync(__dirname + "/missing_cat.json", JSON.stringify(utils.uniq(missing_categories)));
        }
    }
    return result;
};

module.exports = {
    get_images,
    get_pdf,
    get_price_model,
    get_external_links,
    get_category
};