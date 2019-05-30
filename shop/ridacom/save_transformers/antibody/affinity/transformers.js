let fs           = require("fs");
let import_utils = require("../../../../_utils/save_utils.js");
let category_map = require("./category_map.json");
let utils        = require("../../../../../_utils/utils.js");

let missing_categories = [];

let get_pdf = record => {
    let crawler_item = record.crawler_item;
    return (crawler_item.pdf || []).map(link =>({link}))
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

let get_unclassified_fields = record => {
    let crawler_item = record.crawler_item;
    let result       = [];

    ["Background", "Immunogen Information", "Product Information", "Protocols & Troubleshooting", "Research Fields"].forEach(name => {
        let custom_data = crawler_item[name];
        if (!custom_data)
            return;
        utils.objEach(custom_data, (key, value) => {
            if (typeof value === "string") {
                value = [value]
            }
            if (value instanceof Array) {
                value = value.filter(item => typeof item === "string")
                result.push({name: key, value})
            }
        })
    });

    return result;
};

let get_category = record => {
    let crawler_item = record.crawler_item;


    let categories = [];
    for(let i = (crawler_item.category || []).length - 1; i >= 0; i--)
    {
        let cat_names = crawler_item.category[i];

        for(let j = cat_names.length - 1; j >= 0; j--)
        {
            let cat_name = cat_names[j].toLowerCase();
            if (category_map[cat_name]) {
                categories.push(category_map[cat_name]);
                break;
            }
        }
    }

    let result = categories.map(category => import_utils.get_canonical(category.replace(/_/g, " "), ":product_category"));

    if (!result.length){
        result = import_utils.get_canonical("antibody", ":product_category");
        if (crawler_item.categories)
        {
            missing_categories.push(crawler_item.categories.join("/"));
            fs.writeFileSync(__dirname + "/missing_cat.json", JSON.stringify(utils.uniq(missing_categories)));
        }
    }

    return result;
};

module.exports = {
    get_pdf,
    get_bio_object,
    get_category,
    get_unclassified_fields
};