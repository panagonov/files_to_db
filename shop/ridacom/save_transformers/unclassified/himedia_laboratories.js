let es_db        = require("../../../../_utils/es_db.js");
let utils        = require("../../../../_utils/utils.js");
let import_utils = require("../../../_utils/save_utils.js");

let relation_fields = ["supplier", "distributor", "category", "sub_category", "all_categories"];
let export_version  = 1;
let collection_name = "product";

let category_mapping = {
    "Microbiology"                     : "microbiology",
    "Animal Cell Culture"              : "tissue_and_cell_culture",
    "Plant Tissue Culture"             : "tissue_and_cell_culture",
    "Molecular Biology"                : "molecular_biology",
    "Density Gradient Separation Media": "unclassified",
    "Chemicals"                        : "chemical",
    "Laboratory Aids & Equipments"     : "equipment"
};

let create_specification_field = (record) =>{
    let specification_fields = record.specification.map(item => ({
        key: item.key,
        value: {value: item.value},
        ui_text: utils.capitalizeFirstLetter(item.key.replace(/_/g, " "))
    }));

    let agg_specs =  import_utils.create_specification_field(record, null, relation_fields);

    return specification_fields.concat(agg_specs)
};

let _load_original_products_data = async (items, mongo_db) =>
{
    let ids = items.reduce((res, item) => {
        res.push(item._id);
        if (item.sizes)
            item.sizes.forEach(size => res.push(size.product_id));
        return res
    }, []);

    let original_data = await mongo_db.read(collection_name, {body: {oid: {$in : ids}}});

    await mongo_db.update_many(collection_name, {query: {_id: {$in: original_data.map(item => item._id)}}, data: {export_version: export_version}});

    return original_data.reduce((res, item) =>
    {
        res[item.oid] = item;
        return res
    }, {});
};

let custom_save_to_db = async(mongo_db, crawler_db, distributor, type, site, _save_suggest_data) =>
{
    let limit = 500;
    let page = 0;
    let result = [];
    let count = await crawler_db.read(collection_name, {body: {type: type, src: site, tid: distributor, export_version: {$ne : export_version}}, count_only: true});

    do {
        let accumulated_suggest_data = {};
        let es_bulk                  = [];

        result = await crawler_db.read(collection_name, {body: {type: type, src: site, tid: distributor, export_version: {$ne : export_version}}, size: limit});

        let original_products_hash = await _load_original_products_data(result, mongo_db);

        result.forEach(item =>
        {
            let original_items = (item.sizes || []).map( size => original_products_hash[size.product_id]).filter(it => it);

            if (original_items.length)
            {
                let {product_type, converted_item, suggest_data} = convert(item, original_items);

                accumulated_suggest_data = Object.assign(accumulated_suggest_data, suggest_data);

                let _id = converted_item._id;
                delete converted_item._id;
                es_bulk.push({"model_title": product_type, "command_name": "index", "_id": _id, "document": converted_item});
            }
        });

        if (es_bulk.length)
            await es_db.bulk(es_bulk);

        await _save_suggest_data(accumulated_suggest_data);

        let ids = result.map(({_id}) => _id);
        await crawler_db.update_many(collection_name, {query: {_id: {$in: ids}}, data: {export_version: export_version}});

        page++;
        console.log(distributor, type, site, `${page * limit}/${count}`)

    }
    while(result.length === limit)
};

let _getPdf = item =>
{
    return item.pdf ? item.pdf : null;
};

let _getPriceModel = (item, original_items) =>
{
    let item_with_lower_price = (original_items || []).sort((a,b) => a.price.value - b.price.value)[0];
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
        }).filter(item => item)
    };

    return result;
};

let _getAllCategories = (record) => {

    let classification = (record.classification || []).map(item => item.type);
    let all_categories = utils.uniq([].concat(record.categories || [], classification));

    return import_utils.get_canonical(all_categories.join("; "), ":product_category");
};

let mapping = {
    "_id"                   :  record => `PRODUCT_SOURCE:[HIMEDIA]_SUPPLIER:[RIDACOM]_ID:[${record["oid"].trim() || ""}]`,
    "name"                  : "name",
    "oid"                   : "oid",
    "human_readable_id"     : record => `himedia_laboratories_${import_utils.human_readable_id(record.name)}_${record.oid}`,
    "external_links"        : record => [{"key": "himedia_laboratories", "id": record.oid}],
    "price_model"           : record => _getPriceModel(record, record.original_items),
    "description"           : record => record["description"] ? [record["description"]] : null,
    "specification"         : "specification",
    "supplier"              : record => import_utils.get_canonical("Himedia Laboratories", ":supplier"),
    "distributor"           : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "category"              : record => import_utils.get_canonical(record.categories[1], ":product_category"),
    "sub_category"          : record => import_utils.get_canonical([record.categories[2], record.categories[3]].join("; "), ":product_category").slice(0, 1),
    "all_categories"        : record => _getAllCategories(record),
    "pdf"                   : record =>  _getPdf(record),
    "original_link"         : "original_link",
};


let convert = (item, original_items) =>
{
    let record = Object.assign({}, item, {original_items: original_items});

    let result = utils.mapping_transform(mapping, record);
    let service_data = import_utils.build_service_data(result, relation_fields);
    result = Object.assign(result, service_data);

    let type = category_mapping[item.categories[0]];

    let suggest_data = import_utils.build_suggest_data_antibody_elisa_kit(result, relation_fields, type);
    result           = import_utils.clean_result_data(result, relation_fields);

    return {
        product_type: type,
        converted_item : result,
        suggest_data
    }
};

module.exports = {
    convert,
    custom_save_to_db,
    version: export_version
};