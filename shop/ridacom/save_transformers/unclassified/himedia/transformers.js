let fs = require("fs");
let import_utils = require("../../../../_utils/save_utils.js");
let category_map = require("./category_map.json");
let utils        = require("../../../../../_utils/utils.js");

let missing_categories = [];

let _get_string_data = data => {
    if (data) {
        let value = data.value.toString();
        if (value !== "N/A")
            return value
    }

    return null
};

let get_pdf = item =>
{
    return item.pdf ? item.pdf : null;
};

let get_price_model = (item) =>
{
    let original_items = item.original_items;
    let sorted_by_price =(original_items || []).sort((a,b) => (a.price.value || 0) - (b.price.value || 0));
    let item_with_lower_price = sorted_by_price[0];
    let lower_price = item_with_lower_price.price.value;

    let result = {
        "is_multiple" : !!(item.sizes && item.sizes.length),
        "is_ids_are_unique": true,
        "search_price" : lower_price || 0,
        "variation" : item.sizes.map(size => {
            let original_item = original_items.filter(item => item.oid === size.product_id)[0];
            if (!original_item)
                return null;
            if (!original_item.price || !original_item.price.value)
                original_item.price.value = 0;

            return {
                "product_id" : size.product_id,
                "size" : import_utils.size_parser(size.size),
                "price" : original_item.price
            }
        })
        .filter(item => item)
        .sort((a,b) => (a.price.value || 0) - (b.price.value || 0))
    };

    return result;
};

let get_external_links = record => {
    let result = [{"key": "himedia_laboratories", "id": record.oid}];

    if (record.specification && record.specification.length)
    {
        let cas_no = record.specification.filter(item => item.key === "CAS No.")[0];
        if (cas_no && cas_no.value !== "N/A"){
            if (cas_no.value instanceof Array)
            {
                cas_no.value = cas_no.value.filter(item => item !== "0" && item !== "N/A")
                if (cas_no.value.length)
                    result.push({"key": "cas_number", "id": cas_no.value[0]})
            }
            else {
                debugger
            }
        }
    }

    return result
};

let get_shelf_life = record => {
    if (!record.specification || !record.specification.length)
        return null;

    let data = record.specification.filter(item => item.key === "Shelf Life")[0];
    return _get_string_data(data)
};

let get_formula = record => {
    if (!record.specification || !record.specification.length)
        return null;

    let data = record.specification.filter(item => item.key === "Molecular Formula")[0];
    return _get_string_data(data)
};

let get_molecular_weight = record => {
    if (!record.specification || !record.specification.length)
        return null;

    let data = record.specification.filter(item => item.key === "Molecular Weight")[0];

    return data ? import_utils.size_parser(data.value) : null
};

let get_storage_conditions = record => {
    if (!record.specification || !record.specification.length)
        return null;

    let data = record.specification.filter(item => item.key === "Storage")[0];
    return _get_string_data(data)
};

let get_aliases = record => {
    if (!record.specification || !record.specification.length)
        return null;

    let data = record.specification.filter(item => item.key === "Synonyms")[0];

    return data ? data.value.map(item => item.trim()).filter(item => item) : null
};

let get_buffer_form = record => {
    if (!record.specification || !record.specification.length)
        return null;

    let data = record.specification.filter(item => item.key === "Form")[0];
    return _get_string_data(data)
};

let get_safety = record => {
    if (!record.specification || !record.specification.length)
        return null;

    let data = record.specification.filter(item => item.key === "Safety #")[0];
    return _get_string_data(data)
};

let get_risk = record => {
    if (!record.specification || !record.specification.length)
        return null;

    let data = record.specification.filter(item => item.key ===  "Risk #")[0];
    return _get_string_data(data)
};

let get_category = record => {
    let categories = [];
    for(let i = (record.categories || []).length - 1; i >= 0; i--)
    {
        let cat_name = record.categories[i].toLowerCase().replace("®", "");
        if (category_map[cat_name]) {
            categories.push(category_map[cat_name]);
            break;
        }
    }

    if (!categories.length)
    {
        for(let i = (record.categories || []).length; i > 0; i--)
        {
            let cat_name = record.categories.slice(0, i).join("/").toLowerCase().replace("®", "");
            if (category_map[cat_name]) {
                categories.push(category_map[cat_name]);
                break;
            }
        }
    }

    for(let i = 0; i < (record.classification || []).length; i++)
    {
        let cat_name = record.classification[i].type.toLowerCase();
        if (category_map[cat_name]) {
            categories.push(category_map[cat_name]);
        }
    }

    let result = import_utils.get_canonical(categories.join("; ").replace(/_/g, " "), ":product_category");

    if (!result.length){
        debugger
        missing_categories.push(record.categories.join("/"));
        fs.writeFileSync(__dirname + "/missing_cat.json", JSON.stringify(utils.uniq(missing_categories)))
    }
    return result;
};

module.exports = {
    get_risk,
    get_safety,
    get_buffer_form,
    get_aliases,
    get_storage_conditions,
    get_molecular_weight,
    get_formula,
    get_shelf_life,
    get_external_links,
    get_price_model,
    get_pdf,
    get_category
};