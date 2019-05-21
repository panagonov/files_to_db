let fs                 = require("fs");
let country_utils      = require("../../../../../common-components/region_utils/country_utils.js");
let currency_converter = require("../../../../../common-components/region_utils/currency_converter.js");
let utils              = require("../../../../../_utils/utils.js");
let import_utils       = require("../../../../_utils/save_utils.js");
let category_map       = require("./category_map.json");
let fixator            = require("./fixator.js");

let enrich = {
    balance         : require("./balance.js")
};

let missing_categories = [];

let get_pdf = record =>
{
    let crawler_item = record.crawler_item;
    if (crawler_item.pdf) {
        return crawler_item.pdf.map(item =>
        {
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

let get_price_model = record =>
{
    let result = {
        "is_multiple"      : false,
        "is_ids_are_unique": false,
        "search_price"     : record.price ? currency_converter.convert_currency(record.price.currency, "usd", record.price.value) : 0,
        "variation"        : [{
            "price": {
                "value"   : record.price ? record.price.value || 0 : 0,
                "currency": record.price ? record.price.currency || "eur" : "eur"
            }
        }]
    };
    return result;
};

let get_sub_category = record =>
{
    let crawler_item = record.crawler_item;
    let sub_categories = utils.uniq((crawler_item.parent_sub_category || crawler_item.sub_category || []).filter(item => item !== crawler_item._id));
    if (sub_categories[0])
        return  import_utils.get_canonical(sub_categories[0], ":product_sub_category");
    return null;
};

let get_videos = record =>
{
    let crawler_item = record.crawler_item;
    if (!crawler_item.videos || !crawler_item.videos.length)
        return null;

    let result = crawler_item.videos.filter(url => url !== "/blank.html").map(url => ({
        link: url
    }));

    return result.length ? result : null
};

let get_images = record =>
{
    let crawler_item = record.crawler_item;
    if (!crawler_item.images || !crawler_item.images.length)
        return null;

    return crawler_item.images.map(item => {
        delete item.href;
        return item
    })
};

let get_description = record =>
{
    if (record.crawler_item)
    {
        let crawler_item = record.crawler_item;
        let description = crawler_item.description;
        if (description instanceof Array)
            return description;
        else if (description)
            return [description];
    }
    return null
};

let get_other_info = record =>
{
    let crawler_item = record.crawler_item;
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

let get_category = record => {

    let crawler_item = record.crawler_item;
    let category = "";
    for(let i = (crawler_item.sub_category || []).length - 1; i >= 0; i--)
    {
        let cat_name = crawler_item.sub_category[i].toLowerCase();
        if (category_map[cat_name]) {
            category = category_map[cat_name];
            break;
        }
    }

    if (!category && crawler_item.parent_sub_category)
    {
        for(let i = (crawler_item.parent_sub_category || []).length - 1; i >= 0; i--)
        {
            let cat_name = crawler_item.parent_sub_category[i].toLowerCase();
            if (category_map[cat_name]) {
                category = category_map[cat_name];
                break;
            }
        }
    }

    if (!category)
    {
        for(let i = (crawler_item.sub_category || []).length; i > 0; i--)
        {
            let cat_name = crawler_item.sub_category.slice(0, i).join("/").toLowerCase().replace("®", "");
            if (category_map[cat_name]) {
                category = category_map[cat_name];
                break;
            }
        }
    }

    let result = import_utils.get_canonical(category.replace(/_/g, " "), ":product_category");

    if (!result.length)
        result = fixator(record).category || [];

    if (!result.length){
        result = import_utils.get_canonical("Laboratory Scales/Scientific Balances", ":product_category");
        if (crawler_item.sub_category)
        {
            debugger
            missing_categories.push(crawler_item.sub_category.join("/"));
            fs.writeFileSync(__dirname + "/missing_cat.json", JSON.stringify(utils.uniq(missing_categories)));
        }
    }
    return result;
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

module.exports = {
    get_pdf,
    get_price_model,
    get_description,
    get_sub_category,
    get_other_info,
    get_images,
    get_videos,
    get_category,
    get_additional_category_data
};