let utils            = require("../../_utils/utils.js");

let collection_name = "_aff_not_found";
let target_collection = "projects";
let version_match = 2;

let build_index = async(mongo_db) =>
{
    console.log("Build indexes...");
    await mongo_db.create_index(target_collection, {data : {_affiliate_not_found: 1}});
    await mongo_db.create_index(collection_name, {data : {affiliate: 1}});
    await mongo_db.create_index(collection_name, {data : {version_match: 1}});
    console.log("Indexes done");
};

let run = async(mongo_db) =>
{
    await build_index(mongo_db);

    let result = [];
    let page = 0;
    let limit = 100;

    let count = await mongo_db.read(collection_name, {body: {affiliate: {$exists: true}, version_match: {$ne: version_match}}, count_only: true});

    do {
        result = await mongo_db.read(collection_name, {body: {affiliate: {$exists: true}, version_match: {$ne: version_match}}, size: limit});
        let mongo_bulk = [];

        for (let i = 0; i < result.length; i++)
        {
            let found_relation = result[i];
            let found_aff = await mongo_db.read(target_collection, {body: {_affiliate_not_found :found_relation._id}});
            found_aff.forEach(item => {
                item.affiliate_relations = item.affiliate_relations || [];
                item.affiliate_relations.push(found_relation.affiliate);
                item.affiliate_relations = utils.uniq(item.affiliate_relations);
                item._affiliate_not_found = item._affiliate_not_found.filter(aff => aff !== found_relation._id);
                let document = {
                    affiliate_relations: item.affiliate_relations,
                    affiliate_relations_count: item.affiliate_relations.length,
                    _affiliate_not_found: item._affiliate_not_found
                };
                mongo_bulk.push({command_name: "update", _id: item._id, document: document})
            })
        }

        if (mongo_bulk.length)
        {
            let bulk = [];
            let sub_step = 0;
            let sub_limit = 3000;
            let start_index = 0;
            let end_index = 0;

            do {
                start_index = sub_step * sub_limit;
                end_index = start_index + sub_limit;
                bulk = mongo_bulk.slice(start_index, end_index);

                if (bulk.length)
                    await mongo_db.bulk(target_collection, bulk);

                console.log(`Bulk affiliates ${end_index}/${mongo_bulk.length}`);
                sub_step++;
            }
            while(end_index < mongo_bulk.length);

            await mongo_db.update_many(target_collection, {query: {_affiliate_not_found: {$size : 0}}, unset: {_affiliate_not_found: 1}});
            await mongo_db.update_many(collection_name, {query: {_id: {$in : result.map(item => item._id)}}, data: {version_match: version_match}});
        }


        page++;
        console.log(`Matched affiliates ${page * limit}/${count}`);
    }
    while(result.length === limit);

    // await mongo_db.remove_by_query(collection_name, {body: {version_match: version_match}});
};

module.exports = {
    run
};