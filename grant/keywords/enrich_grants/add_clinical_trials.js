let keywords_builder = require("../keywords_builder.js");
let utils            = require("../../../_utils/utils.js");

let collection_name = "clinical_studies";
let target_collection = "projects";
let version = 1;

let build_index = async(mongo_db) =>
{
    console.log("Build indexes...");
    await mongo_db.create_index(collection_name, {data : {version: 1}});
    console.log("Indexes done");
};

let add_clinical_trials = async(mongo_db) =>
{
    console.log("Add clinical trials");
    await build_index(mongo_db);

    let clinical_trials = [];
    let limit = 100;
    let page = 0;

    let count = await mongo_db.read(collection_name, {body: {version: {$ne : version}}, count_only: true});

    do {
        let mongo_bulk = [];

        clinical_trials = await mongo_db.read(collection_name, {body: {version: {$ne : version}}, size: limit});

        let found_clinical_trails = clinical_trials.filter(item => keywords_builder.get(item.clinical_trail_id));

        let map_hash = found_clinical_trails.reduce((res, item) => {
            res[item.project_id] = res[item.project_id] || [];
            res[item.project_id].push(item.clinical_trail_id);
            return res;
        }, {});

        let projects = await mongo_db.read(target_collection, {body: {core_project_num: {$in : Object.keys(map_hash)}}});

        projects.forEach(item => {
            item.clinical_trial_relations = (item.clinical_trial_relations || []).concat(map_hash[item.core_project_num]);
            item.clinical_trial_relations = utils.uniq(item.clinical_trial_relations);

            let document = {
                clinical_trial_relations : item.clinical_trial_relations,
                clinical_trial_relations_count : item.clinical_trial_relations.length
            };
            mongo_bulk.push({command_name: "update", _id: item._id, document: document})
        });

        if (mongo_bulk.length)
            await mongo_db.bulk(target_collection, mongo_bulk);

        mongo_bulk = [];

        clinical_trials.forEach(item => {
            let document = {
                version:  version,
                ...!keywords_builder.get(item.clinical_trail_id) ? {not_found : true} : ""
            };

            mongo_bulk.push({command_name: "update", _id: item._id, document: document});
        });

        if (mongo_bulk.length)
            await mongo_db.bulk(collection_name, mongo_bulk);

        page++;
        console.log(`Trials in Grants ${page * limit}/${count}`);
    }
    while(clinical_trials.length === limit)
};

module.exports = add_clinical_trials;