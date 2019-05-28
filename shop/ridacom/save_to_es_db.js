let fs           = require("fs");
let es_db        = require("../../_utils/es_db.js");
let utils        = require("../../_utils/utils.js");
let save_utils   = require("../_utils/save_utils.js");
let image_errors = require("../../_utils/errors.json");

image_errors = image_errors.reduce((res, item) =>{
    res[item] = 1;
    return res;
}, {});

let collection_name         = "product";
let suggest_collection_name = "shop_suggest";

let directory_reader = require("../../_utils/directory_reader.js");

let converters = directory_reader(`${__dirname}/save_transformers/`, "js", {recursive: true, recursive_dept: 1});

let build_index = async(mongo_db) =>
{
    console.log("Build indexes...");
    await mongo_db.create_index(collection_name, {data : {type: 1, src: 1, tid: 1 }});
    await mongo_db.create_index(collection_name, {data : {export_version: 1}});
    console.log("Indexes done");
};

let _save_suggest_data = async (suggest_data) =>
{
    let size = 800;
    let page = 0;
    let all_ids = Object.keys(suggest_data);
    let start_index = 0;
    let end_index = 0;
    let db_data_hash = {};

    do {
        start_index = page * size;
        end_index = start_index + size;
        let ids = all_ids.slice(start_index, end_index).filter(id => id);

        let db_data = await es_db.read_unlimited(suggest_collection_name, {body: {"query" : {"terms" : {"_id" : ids}}, "_source" : ["category", "type", "synonyms"]}, size: ids.length});
        db_data.data.forEach(item => db_data_hash[item._id] = item);
        page++;
    }
    while(end_index < all_ids.length);

    let es_bulk = Object.keys(suggest_data).map(id => {
        let item_in_db_hash = db_data_hash[id];

        let command = item_in_db_hash ? "update" : "index";

        let document = suggest_data[id];
        if (item_in_db_hash) {
            document.category = utils.uniq([].concat(document.category || [], item_in_db_hash.category || [])).filter(item => item);
            document.type = utils.uniq([].concat(document.type || [], item_in_db_hash.type || [])).filter(item => item);
            document.synonyms = utils.uniq([].concat(document.synonyms || [], item_in_db_hash.synonyms || [])).filter(item => item);
        }

        if (document.category.some(item => ["antibody","elisa_kit","protein"].indexOf(item) !== -1))
            debugger

        return {model_title: suggest_collection_name, command_name: command, "_id": id, "document":document}});

    if (es_bulk.length)
        await es_db.bulk(es_bulk);
};

let _load_crawler_data = async (items, crawler_db, converter) =>
{
    if (converter.load_crawler_data)
        return converter.load_crawler_data(items, crawler_db);

    let crawler_ids = converter.get_crawler_ids ? converter.get_crawler_ids(items) : items.map(({oid}) => oid);

    let crawler_data = await crawler_db.read(collection_name, {body: {_id: {$in : crawler_ids}}});

    for (let i = 0; i < (converter.advance_crawler_search_field || []).length; i++)
    {
        let data =  await crawler_db.read(collection_name, {body: {[converter.advance_crawler_search_field[i]]: {$in : crawler_ids}}});
        crawler_data = crawler_data.concat(data)
    }

    return crawler_data.reduce((res, item) =>
    {
        res[item._id] = item;
        return res
    }, {});
};

let load_cache_images = async(ids, crawler_db) => {
    let cache_data = await crawler_db.read("product_image", {body: {_id: {$in: ids}}});
    return cache_data.reduce((res, item) =>{
        res[item._id] = item;
        return res;
    }, {})
};


let load_cache_pdfs = async(ids, crawler_db) => {
    let cache_data = await crawler_db.read("product_pdf", {body: {_id: {$in: ids}}});
    return cache_data.reduce((res, item) =>{
        res[item._id] = item;
        return res;
    }, {})
};

let bulk_result = async(es_db, crawler_db, es_bulk) => {
    if (es_bulk.length){

        let ids = es_bulk.map(({_id}) => _id);
        let cached_pdfs = await load_cache_pdfs(ids, crawler_db);
        let cached_images = await load_cache_images(ids, crawler_db);

        es_bulk.forEach(item => {
            if (cached_pdfs[item._id])
                item.document.pdf = cached_pdfs[item._id].pdf;

            if (cached_images[item._id] && cached_images[item._id].images && !cached_images[item._id].images.some(({link}) => image_errors[link]))
                item.document.images = cached_images[item._id].images;
        });

        await es_db.bulk(es_bulk);
    }
}

let save_to_db = async(mongo_db, crawler_db, distributor, type, site, update_fields_list) =>
{
    let converter = converters[type][site];

    if (!converter)
        return;

    let export_version =  converters[type][site].version || 1;

    if (converter.init)
        await converter.init();

    let limit = 600;
    let page = 0;
    let result = [];
    let count = await mongo_db.read(collection_name, {body: {type: type, src: site, tid: distributor, export_version: {$ne : export_version}}, count_only: true});
    let not_found = [];
    let not_found_custom = [];
    let custom_errors = [];

    do {
        let accumulated_suggest_data = {};
        let es_bulk = [];
        let custom_data;

        result = await mongo_db.read(collection_name, {body: {type: type, src: site, tid: distributor, export_version: {$ne : export_version}}, size: limit});

        let crawler_hash = await _load_crawler_data(result, crawler_db, converter);

        if (converter.load_custom_data)
        {
            custom_data = await converter.load_custom_data(mongo_db, crawler_db, result);
            if (custom_data.error)
                custom_errors.concat(custom_data.error);
            custom_data = custom_data.result
        }

        result.forEach(item =>
        {
            let id = item.oid;
            let crawler_item = converter.get_crawler_item ? converter.get_crawler_item(item, crawler_hash) : crawler_hash[id];

            if (!crawler_item)
            {
                if (!custom_data || !custom_data[id])
                {
                    not_found.push(id);
                }
                crawler_item = {}
            }

            let {converted_item, suggest_data, missing_data} = converter.convert(item, crawler_item, custom_data);

            if (!converted_item){
                return;
            }

            accumulated_suggest_data = save_utils.accumulate_suggest(accumulated_suggest_data, suggest_data);

            let document = {};

            if (update_fields_list)
            {
                utils.objEach(update_fields_list, key => document[key] = converted_item[key])
            }
            else
            {
                document = converted_item
            }

            es_bulk.push({"model_title": "product", "command_name": update_fields_list ? "update" : "index", "_id": item._id, "document": document});

            if (missing_data)
                not_found_custom = not_found_custom.concat(missing_data);
        });

        await bulk_result(es_db, crawler_db, es_bulk);

        await _save_suggest_data(accumulated_suggest_data);

        let ids = result.map(({_id}) => _id);
        await mongo_db.update_many(collection_name, {query: {_id: {$in: ids}}, data: {export_version: export_version}});

        page++;
        console.log(distributor, type, site, `${page * limit}/${count}`)

    }
    while(result.length === limit);

    if(not_found.length)
        fs.writeFileSync(__dirname + `/_missing_data/not_found_${site}_${type}.json`, JSON.stringify(not_found), "utf8");
    if(not_found_custom.length)
        fs.writeFileSync(__dirname + `/_missing_data/not_found_custom_${site}_${type}.json`, JSON.stringify(utils.uniq(not_found_custom)), "utf8");
    if(custom_errors.length)
        fs.writeFileSync(__dirname + `/_missing_data/errors_custom_${site}_${type}.json`, JSON.stringify(utils.uniq(custom_errors)), "utf8");
};

let run = async(mongo_db, crawler_db, distributor, update_fields_list) =>
{
    await build_index(mongo_db);

    for (let type in converters)
    {
        for (let site in converters[type])
        {
            let converter = converters[type][site];

            if(converter.disable)
                continue;

            if (converter.custom_save_to_db)
            {
                await converter.custom_save_to_db(mongo_db, crawler_db, distributor, type, site, _save_suggest_data, bulk_result, update_fields_list);
            }
            else
            {
                await save_to_db(mongo_db, crawler_db, distributor, type, site, update_fields_list)
            }
        }
    }
};

let clean = async(mongo_db, crawler_db) =>
{
    //todo
};

module.exports = {
    run,
    clean
};