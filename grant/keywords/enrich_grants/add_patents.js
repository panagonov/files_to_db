let utils            = require("../../../_utils/utils.js");

let collection_name = "patents";
let target_collection = "projects";
let version = 1;

let build_index = async(mongo_db) =>
{
    console.log("Build indexes...");
    await mongo_db.create_index(collection_name, {data : {version: 1}});
    console.log("Indexes done");
};

let add_patents = async(mongo_db) =>
{
    console.log("Add patents");
    await build_index(mongo_db);

    let result = [];
    let limit = 100;
    let page = 0;

    let count = await mongo_db.read(collection_name, {body: {version: {$ne : version}}, count_only: true});

    do {
        let mongo_bulk = [];
        result = await mongo_db.read(collection_name, {body: {version: {$ne : version}}, size: limit});
        let map_hash = result.reduce((res, item) => {
            res[item.project_id] = res[item.project_id] || [];
            res[item.project_id].push(item._id);
            return res;
        }, {});

        let projects = await mongo_db.read(target_collection, {body: {core_project_num: {$in : Object.keys(map_hash)}}});

        projects.forEach(item => {
            item.patent_relations = (item.patent_relations || []).concat(map_hash[item.core_project_num]);
            item.patent_relations = utils.uniq(item.patent_relations);
            let document = {
                patent_relations: item.patent_relations,
                patent_relations_count: item.patent_relations.length
            };
            mongo_bulk.push({command_name: "update", _id: item._id, document: document})
        });

        if (mongo_bulk.length)
            await mongo_db.bulk(target_collection, mongo_bulk);

        await mongo_db.update_many(collection_name, {
            query: {_id: {$in: result.map(({_id}) => _id)}},
            data: {version:  version}
        });

        page++;
        console.log(`Keywords ${page * limit}/${count}`);
    }
    while(result.length === limit)
};

module.exports = add_patents;