let es_db = require("../../../_utils/es_db.js");
let utils = require("../../../_utils/utils.js");

let collection_name = "link_tables";
let target_collection = "projects";
let version = 1;

let build_index = async(mongo_db, target_collection) =>
{
    console.log("Build indexes...");
    await mongo_db.create_index(collection_name, {data : {version: 1}});
    await mongo_db.create_index(collection_name, {data : {project_number: 1}});
    await mongo_db.create_index(target_collection, {data : {version_pubmed: 1}});
    console.log("Indexes done");
};

let add_pubmeds = async(mongo_db) =>
{
    console.log("Add pubmeds");
    await build_index(mongo_db, target_collection);

    let projects = [];
    let limit = 1000;
    let page = 0;
    let found = 0;
    let not_found = 0;

    let count = await mongo_db.read(target_collection, {body: {version_pubmed: {$ne : version}}, count_only: true});

    do {
        let mongo_bulk = [];

        projects = await mongo_db.read(target_collection, {body: {version_pubmed: {$ne : version}}, size: limit});

        let pubmeds = await mongo_db.read(collection_name, {body: {project_number: {$in: projects.map(({core_project_num}) => core_project_num)}}});

        let map_hash = pubmeds.reduce((res, item) => {
            res[item.project_number] = res[item.project_number] || [];
            res[item.project_number].push(item.pubmed_id);
            return res;
        }, {});

        let original_pubmeds = await es_db.read_unlimited("pubmed", {body: {
                "query" : {
                    "terms" : {"external_links.id": pubmeds.map(({pubmed_id}) => pubmed_id)}
                },
                _source: ["external_links", "authors"]
            }, size: limit});

        let original_pubmeds_hash = original_pubmeds.data.reduce((res, item) => {
            let pubmed_id = item.external_links.filter(({key}) => key === "PUBMED")[0].id;
            res[pubmed_id] = item;
            return res;
        }, {});

        projects.forEach((item, index) => {
            let document = {version_pubmed: version};
            let pubmed_ids = map_hash[item.core_project_num];

            (pubmed_ids || []).forEach(pubmed_id =>{
                if (original_pubmeds_hash[pubmed_id])
                {
                    found++;
                    item.pubmed_relations = item.pubmed_relations || [];
                    item.pubmed_relations.push(original_pubmeds_hash[pubmed_id]._id);

                    // item.author_relations = item.author_relations || [];
                    // item.author_relations = (original_pubmeds_hash[pubmed_id].authors || []).map(({_id}) => _id);
                }
                else {
                    not_found++;
                    item._pubmed_not_found = item._pubmed_not_found || [];
                    item._pubmed_not_found.push(pubmed_id);
                }
            });

            if (item.pubmed_relations && item.pubmed_relations.length) {
                item.pubmed_relations = utils.uniq(item.pubmed_relations);
                document.pubmed_relations = item.pubmed_relations;
                document.pubmed_relations_count  = item.pubmed_relations.length;
            }

            // if (item.author_relations && item.author_relations.length) {
                // item.author_relations = utils.uniq(item.author_relations);
                // document.author_relations = item.author_relations;
                // document.author_relations_count = item.author_relations.length;
            // }

            if (item._pubmed_not_found && item._pubmed_not_found.length) {
                item._pubmed_not_found = utils.uniq(item._pubmed_not_found);
                document._pubmed_not_found = item._pubmed_not_found
            }

            mongo_bulk.push({command_name: "update", _id: item._id, document: document})
        });
        if (mongo_bulk.length)
            await mongo_db.bulk(target_collection, mongo_bulk);
        page++;
        console.log(`Pubmed relations in grants ${page * limit}/${count} - found: ${found}/${not_found}`);
    }
    while(projects.length === limit)
};


module.exports = add_pubmeds;