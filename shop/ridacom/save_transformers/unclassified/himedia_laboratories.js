let es_db        = require("../../../../_utils/es_db.js");
let utils        = require("../../../../_utils/utils.js");
let import_utils = require("../../../_utils/save_utils.js");

let relation_fields = ["supplier", "distributor", "category", "sub_category"];
let export_version  = 4;
let collection_name = "product";

let _get_string_data = data => {
    if (data) {
        let value = data.value.toString();
        if (value !== "N/A")
            return value
    }

    return null
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

let custom_save_to_db = async(mongo_db, crawler_db, distributor, type, site, _save_suggest_data, bulk_result, update_fields_list) =>
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
                let {converted_item, suggest_data} = convert(item, original_items);

                accumulated_suggest_data = import_utils.accumulate_suggest(accumulated_suggest_data, suggest_data);

                let _id = converted_item._id;
                delete converted_item._id;

                let document = {};

                if (update_fields_list)
                {
                    utils.objEach(update_fields_list, key => document[key] = converted_item[key])
                }
                else
                {
                    document = converted_item
                }

                es_bulk.push({"model_title": collection_name, "command_name": update_fields_list ? "update" : "index", "_id": _id, "document": document});
            }
        });

        await bulk_result(es_db, crawler_db, es_bulk);

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

let _get_external_links = record => {
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

let _get_shelf_life = record => {
    if (!record.specification || !record.specification.length)
        return null;

    let data = record.specification.filter(item => item.key === "Shelf Life")[0];
    return _get_string_data(data)
};

let _get_formula = record => {
    if (!record.specification || !record.specification.length)
        return null;

    let data = record.specification.filter(item => item.key === "Molecular Formula")[0];
    return _get_string_data(data)
};

let _get_molecular_weight = record => {
    if (!record.specification || !record.specification.length)
        return null;

    let data = record.specification.filter(item => item.key === "Molecular Weight")[0];

    return data ? import_utils.size_parser(data.value) : null
};

let _get_storage_conditions = record => {
    if (!record.specification || !record.specification.length)
        return null;

    let data = record.specification.filter(item => item.key === "Storage")[0];
    return _get_string_data(data)
};

let _get_aliases = record => {
    if (!record.specification || !record.specification.length)
        return null;

    let data = record.specification.filter(item => item.key === "Synonyms")[0];

    return data ? data.value.map(item => item.trim()).filter(item => item) : null
};

let _get_buffer_form = record => {
    if (!record.specification || !record.specification.length)
        return null;

    let data = record.specification.filter(item => item.key === "Form")[0];
    return _get_string_data(data)
};

let _get_safety = record => {
    if (!record.specification || !record.specification.length)
        return null;

    let data = record.specification.filter(item => item.key === "Safety #")[0];
    return _get_string_data(data)
};

let _get_risk = record => {
    if (!record.specification || !record.specification.length)
        return null;

    let data = record.specification.filter(item => item.key ===  "Risk #")[0];
    return _get_string_data(data)
};

let mapping = {
    "_id"                   :  record => `PRODUCT_SOURCE:[HIMEDIA]_SUPPLIER:[RIDACOM]_ID:[${record["oid"].trim() || ""}]`,
    "name"                  : "name",
    "oid"                   : "oid",
    "human_readable_id"     : record => `himedia_laboratories_${import_utils.human_readable_id(record.name, record.oid)}`,
    "external_links"        : _get_external_links,
    "price_model"           : record => _getPriceModel(record, record.original_items),
    "description"           : record => record["description"] ? [record["description"]] : null,
    "shelf_life"            : _get_shelf_life,
    "formula"               : _get_formula,
    "molecular_weight"      : _get_molecular_weight,
    "storage_conditions"    : _get_storage_conditions,
    "aliases"               : _get_aliases,
    "buffer_form"           : _get_buffer_form,
    "safety"                : _get_safety,
    "risk"                  : _get_risk,
    "supplier"              : record => import_utils.get_canonical("Himedia Laboratories", ":supplier"),
    "distributor"           : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "category"              : record => import_utils.get_canonical(record.categories[0], ":product_category"),
    "sub_category"          : record => import_utils.get_canonical([record.categories[1], record.categories[2], record.categories[3]].join("; "), ":product_category").slice(0, 1),
    "pdf"                   : record =>  _getPdf(record),
    "original_link"         : "original_link",
    "others"                : record => record.used_for ? record.used_for[0] : null,
    "images"                : "original_items.images"
};


let convert = (item, original_items) =>
{
    let record = Object.assign({}, item, {original_items: original_items});

    let result = utils.mapping_transform(mapping, record);

    let service_data = import_utils.build_service_data(result, relation_fields);
    result = Object.assign(result, service_data);

    let type = result.category[0][1];

    let suggest_data = import_utils.build_suggest_data(result, relation_fields, type);
    result           = import_utils.clean_result_data(result, relation_fields);

    if (result.images )
    {
        count++;
        console.log(count)
    }

    return {
        converted_item : result,
        suggest_data
    }
};

module.exports = {
    convert,
    custom_save_to_db,
    version: export_version,
    // disable: true
};