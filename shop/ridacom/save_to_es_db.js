let fs       = require("fs");
let es_db    = require("../../_utils/elasticsearch/db.js");
let utils    = require("../../_utils/utils.js");
let Mongo_db = require("../../_utils/db.js");

let collection_name         = "product";
let suggest_collection_name = "shop_suggest";

let mapping = {
    "antibody" : {
        "cloud_clone" : {converter: require("./save_transformers/antibody/cloud_clone.js"),     version: 2},
        "abbkine"     : {converter: require("./save_transformers/antibody/abbkine.js"),         version: 1},
        "genome_me"   : {converter: require("./save_transformers/antibody/genome_me.js"),       version: 2}
    },
    "elisa_kit" : {
        "cloud_clone" : {converter: require("./save_transformers/elisa_kit/cloud_clone.js"),    version: 2},
        "abbkine"     : {converter: require("./save_transformers/elisa_kit/abbkine.js"),        version: 2}
    },
    "chemical" : {
        "abbkine"     : {converter: require("./save_transformers/chemical/abbkine.js"),         version: 2}
    },
    "protein" : {
        "cloud_clone" : {converter: require("./save_transformers/protein/cloud_clone.js"),      version: 2},
        "abbkine"     : {converter: require("./save_transformers/protein/abbkine.js"),          version: 4}
    }
};

let crawler_db;

let init = async() => {
    await es_db.init();
    crawler_db = new Mongo_db();
    await crawler_db.init({host: "85.10.244.21", database: "crawlers", user: "hashstyle", "pass": "Ha5h5tylE"});
};

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
    let suggest_category_hash = {};

    do {
        start_index = page * size;
        end_index = start_index + size;
        let ids = all_ids.slice(start_index, end_index);

        let db_data = await es_db.read_unlimited(suggest_collection_name, {body: {"query" : {"terms" : {"_id" : ids}}, "_source" : ["category"]}, size: ids.length});
        db_data.data.forEach(item => suggest_category_hash[item._id] = item.category);
        page++;
    }
    while(end_index < all_ids.length);

    let es_bulk = Object.keys(suggest_data).map(id => {
        let item_in_hash = suggest_category_hash[id];
        let command = item_in_hash ? "update" : "index";

        let document = suggest_data[id];
        if (item_in_hash) {
            document.category = utils.uniq(document.category.concat(item_in_hash));
        }

        return {model_title: suggest_collection_name, command_name: command, "_id": id, "document":document}});

    if (es_bulk.length)
        await es_db.bulk(es_bulk);
};

let _load_crawler_data = async (items) =>
{
    let crawler_ids = items.map(({oid}) => oid);

    let crawler_data = await crawler_db.read(collection_name, {body: {_id: {$in : crawler_ids}}});

    return crawler_data.reduce((res, item) =>
    {
        res[item._id] = item;
        return res
    }, {});
};

let save_to_db = async(mongo_db, type, site) =>
{
    let converter      =  mapping[type][site].converter;
    let export_version = mapping[type][site].version;

    if (converter.init)
        await converter.init();

    let limit = 500;
    let page = 0;
    let result = [];
    let count = await mongo_db.read(collection_name, {body: {type: type, src: site, tid: "ridacom", export_version: {$ne : export_version}}, count_only: true});
    let not_found = [];
    let not_found_custom = [];
    let custom_errors = [];

    do {
        let accumulated_suggest_data = {};
        let es_bulk = [];
        let custom_data;

        result = await mongo_db.read(collection_name, {body: {type: type, src: site, tid: "ridacom", export_version: {$ne : export_version}}, size: limit});

        let crawler_hash = await _load_crawler_data(result);

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
            let crawler_item = crawler_hash[id];

            if (!crawler_item)
            {
                not_found.push(id);
                crawler_item = {}
            }

            let {converted_item, suggest_data, missing_data} = converter.convert(item, crawler_item, custom_data);

            accumulated_suggest_data = Object.assign(accumulated_suggest_data, suggest_data);
            es_bulk.push({"model_title": type, "command_name": "index", "_id": item._id, "document": converted_item});

            if (missing_data)
                not_found_custom = not_found_custom.concat(missing_data);
        });

        if (es_bulk.length)
            await es_db.bulk(es_bulk);

        await _save_suggest_data(accumulated_suggest_data);

        let ids = result.map(({_id}) => _id);
        await mongo_db.update_many(collection_name, {query: {_id: {$in: ids}}, data: {export_version: export_version}});

        page++;
        console.log("ridacom", type, site, `${page * limit}/${count}`)

    }
    while(result.length === limit);

    if(not_found.length)
        fs.writeFileSync(__dirname + `/not_found_${site}_${type}.json`, JSON.stringify(not_found), "utf8");
    if(not_found_custom.length)
        fs.writeFileSync(__dirname + `/not_found_custom_${site}_${type}.json`, JSON.stringify(utils.uniq(not_found_custom)), "utf8");
    if(custom_errors.length)
        fs.writeFileSync(__dirname + `/errors_custom_${site}_${type}.json`, JSON.stringify(utils.uniq(custom_errors)), "utf8");
};

let run = async(mongo_db) =>
{
    await init();
    await build_index(mongo_db);

    for (let type in mapping)
    {
        for (let site in mapping[type])
        {
           await save_to_db(mongo_db, type, site)
        }
    }
};

module.exports = {
    run
};