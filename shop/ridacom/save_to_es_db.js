let fs       = require("fs");
let es_db    = require("../../_utils/elasticsearch/db.js");
let Mongo_db = require("../../_utils/db.js");

let export_version = 5;
let collection_name = "product";

let mapping = {
    "antibody" : {
        "cloud_clone" : require("./import_mapping/antibody/cloud_clone.js")
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

let save_to_db = async(mongo_db, type, site) =>
{
    let limit = 500;
    let page = 0;
    let result = [];
    let count = await mongo_db.read(collection_name, {body: {type: type, src: site, tid: "ridacom", export_version: {$ne : export_version}}, count_only: true});
    let not_found = [];

    do {
        let es_bulk = [];
        result = await mongo_db.read(collection_name, {body: {type: type, src: site, tid: "ridacom", export_version: {$ne : export_version}}, size: limit});
        let crawler_ids = result.map(({oid}) => oid);

        let crawler_data = await crawler_db.read(collection_name, {body: {_id: {$in : crawler_ids}}});

        let crawler_hash = crawler_data.reduce((res, item) =>
        {
            res[item._id] = item;
            return res
        }, {});

        result.forEach(item =>
        {
            let id = item.oid;
            let crawler_item = crawler_hash[id];

            if (!crawler_item)
            {
                not_found.push(id);
                return;
            }
            let res = mapping[type][site].convert(item, crawler_item);
            es_bulk.push({"model_title": type, "command_name": "index", "_id": item._id, "document": res})
        });

        if (es_bulk.length)
            await es_db.bulk(es_bulk);
        let ids = result.map(({_id}) => _id);
        await mongo_db.update_many(collection_name, {query: {_id: {$in: ids}}, data: {export_version: export_version}})

        page++;
        console.log("ridacom", type, site, `${page * limit}/${count}`)

    }while(result.length === limit);

    fs.writeFileSync(__dirname + "/not_found.json", JSON.stringify(not_found), "utf8")
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
}