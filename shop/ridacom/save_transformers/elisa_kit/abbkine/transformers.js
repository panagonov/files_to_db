let fs           = require("fs");
let import_utils = require("../../../../_utils/save_utils.js");
let category_map = require("./category_map.json");
let utils        = require("../../../../../_utils/utils.js");

let missing_categories = [];

let get_images = record =>
{
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
        result = [{ link: crawler_item.pdf }]
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

let get_bio_object = record =>
{
    if (!record.bio_object_data || !record.bio_object_data.length)
        return null;

    return record.bio_object_data.map(bio_object => ({
        "type": "protein",
        ...bio_object.name                  ? {"name": bio_object.name}                                                 : "",
        ...bio_object.symbol                ? {"symbol": bio_object.symbol}                                             : "",
        ...bio_object.aliases               ? {"aliases": (bio_object.aliases || []).concat(bio_object.ids || [])}      : "",
        ...bio_object.gene                  ? {"gene": bio_object.gene}                                                 : "",
        ...bio_object.organism              ? {"organism": bio_object.organism}                                         : "",
        ...bio_object.ncbi_organism_tax_id  ? {"ncbi_organism_tax_id": bio_object.ncbi_organism_tax_id}                 : "",

    }));
};

let get_calibration_range = record => {
    let result = null;
    let value = record["calibration_range"];
    if (value && value.indexOf("-") !== -1)
    {
        let range = value.split("-");
        let from = import_utils.size_parser(range[0]);
        let to = import_utils.size_parser(range[1]);

        result = {
            from ,
            to
        }
    }
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
        result = import_utils.get_canonical("elisa kits", ":product_category");
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
    get_calibration_range,
    get_category
};