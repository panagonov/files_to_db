let es_db = require("../../../_utils/elasticsearch/db.js");

let collection_name = "link_tables";

let build_index = async(mongo_db) =>
{
    await mongo_db.create_index(collection_name, {data : {version: 1}});
};

let add_pubmeds = async(version, target_collection, mongo_db) =>
{
    console.log("Add pubmeds");
    await build_index(mongo_db);

    let pubmeds = [];
    let limit = 500;
    let page = 0;

    let count = await mongo_db.read(collection_name, {body: {version: {$ne : version}}, count_only: true});

    do {
        let mongo_bulk = [];

        pubmeds = await mongo_db.read(collection_name, {body: {version: {$ne : version}}, size: limit});
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

        let projects = await mongo_db.read(target_collection, {body: {core_project_num: {$in : Object.keys(map_hash)}}});

        projects.forEach(item => {
            let document = {};
            let pubmed_ids = map_hash[item.core_project_num];
            pubmed_ids.forEach(pubmed_id =>{
                if (original_pubmeds_hash[pubmed_id])
                {
                    item.pubmed_relations = item.pubmed_relations || [];
                    item.pubmed_relations.push(pubmed_id);
                    item.author_relations = item.author_relations || [];
                    item.author_relations = (original_pubmeds_hash[pubmed_id].authors || []).map(({_id}) => _id);

                    document = {
                        pubmed_relations : item.pubmed_relations,
                        pubmed_relations_count : item.pubmed_relations.length,
                        author_relations : item.author_relations,
                        author_relations_count : item.author_relations.length
                    };
                }
                else {
                    item._pubmed_not_found = item._pubmed_not_found || [];
                    item._pubmed_not_found.push(pubmed_id);
                    document = {
                        _pubmed_not_found: item._pubmed_not_found
                    }
                }
            });
            mongo_bulk.push({command_name: "update", _id: item._id, document: document})
        });

        let step = 0;
        let step_limit = 3000;
        let start_index = 0, end_index = 0;

        do {
            start_index = step * step_limit;
            end_index = start_index + step_limit;
            let bulk = mongo_bulk.slice(start_index, end_index);
            if (bulk.length)
                await mongo_db.bulk(target_collection, bulk);
            step++
        }
        while (end_index < mongo_bulk.length);


        mongo_bulk = [];

        pubmeds.forEach(item =>
        {
            let document = {
                version: version,
                ...!original_pubmeds_hash[item.pubmed_id] ? {not_found: true} : ""
            };

            mongo_bulk.push({command_name: "update", _id: item._id, document: document})
        });

        if (mongo_bulk.length)
            await mongo_db.bulk(collection_name, mongo_bulk);

        page++;
        console.log(`Pubmeds ${page * limit}/${count}`);
    }
    while(pubmeds.length === limit)
};

module.exports = add_pubmeds;