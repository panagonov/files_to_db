let fs           = require("fs");
let import_utils = require("../../../../_utils/save_utils.js");
let category_map = require("../../antibody/cloud_clone/category_map.json");
let utils        = require("../../../../../_utils/utils.js");

let missing_categories = [];

let get_images = record => {
    let crawler_item = record.crawler_item;
    let result = [];

    if(crawler_item.package_images && crawler_item.package_images.length)
    {
        crawler_item.package_images.forEach(link => result.push({link: link, type: "package"}))
    }
    if(crawler_item.images && crawler_item.images.length)
    {
        crawler_item.images.forEach(data => {
            if (typeof data === "string")
                result.push({link: data});
            else
            {
                result.push({link: data.link, text: [data.text]})
            }
        })
    }
    if(crawler_item.certificate && crawler_item.certificate.length)
    {
        {
            crawler_item.certificate.forEach(link => result.push({link: link, type: "certificate"}))
        }
    }

    return  result.length ? result : null
};

let get_pdf = record =>
{
    let crawler_item = record.crawler_item;

    let result = null;

    if(crawler_item.pdf)
    {
        result = [{
            link: crawler_item.pdf.link,
            ...crawler_item.pdf.preview ? {"thumb_link" : crawler_item.pdf.preview} : ""
        }]
    }

    return result;
};

let get_price_model = record =>
{
    let crawler_item = record.crawler_item;
    let result = {
        ...crawler_item.price && crawler_item.price.length ? {"is_multiple" : true} : "",
        ...record.price.promotion ? {"discount" : {
                "default" : {
                    "type" : "percent",
                    "value" : record.price.promotion.discountPercentage
                }
            }} : "",
        "variation" :[]
    };

    let search_price = record.price ? record.price.value || 0 : 0;

    search_price ? result.search_price = search_price : null;

    (crawler_item.price || []).forEach((price, index )=> {
        let size = import_utils.size_parser(crawler_item.size[index]);
        result.variation.push({
            "price" : {
                "value"   : price || 0,
                "currency": "usd",
            },
            "size"    : size
        })
    });

    return result;
};

let get_bio_object = record => {
    if (!record.item_name  || !record.item_name.trim())
        return null;

    return[{
        "type": "protein",
        ...record.item_name ? {"name": record.item_name} : "",
        ...record.aliases && record.aliases[0] ? {"symbol": record.aliases[0]} : "",
        ...record.aliases ? {"aliases": record.aliases} : ""
    }]
};

let get_category = record => {
    let crawler_item = record.crawler_item;

    let categories = [];
    for(let i = (crawler_item.categories || []).length - 1; i >= 0; i--)
    {
        let cat_names = crawler_item.categories[i];

        for(let j = cat_names.length - 1; j >= 0; j--)
        {
            let cat_name = cat_names[j];
            if (category_map[cat_name]) {
                categories.push(category_map[cat_name]);
                break;
            }
        }
    }

    let result = categories.map(category => import_utils.get_canonical(category.replace(/_/g, " "), ":product_category"));

    if (!result.length){
        result = import_utils.get_canonical("Proteins and Peptides", ":product_category");
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
    get_bio_object,
    get_category
};