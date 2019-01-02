let fs       = require("fs");
let Mongo_db = require("../_utils/db.js");
let es_db    = require("../_utils/elasticsearch/db.js");
let utils    = require("../_utils/utils.js");

let mongo_db;

let indexes = ["gene", "pathway", "drug_or_chemical", "author", "disease", "anatomy", "organism", "affiliate", "pubmed", "process"];

let init_dbs = async() =>
{
    await es_db.init();
    mongo_db = new Mongo_db();
    await mongo_db.init("clinical_trails");
};

let remove_old_relations_count = async() => {
    let limit  = 1000;
    let page   = 0;
    let result = [];
    let body = {
        "query" : {
            "bool" : {
                "must" : {
                    "exists" : {"field" : "clinical_trial_relations_count"}
                },
                "must_not" : {
                    "term" : {"clinical_trial_relations_count" : 0}
                }
            }
        },
        "_source": ["clinical_trial_relations_count"]
    };

    do {

        let relations = await es_db.read_unlimited(indexes, {body : body, size: limit, add_type: true});
        result = relations.data;
        let es_bulk = [];
        result.forEach(node =>
        {
            es_bulk.push({"model_title": node._type, "command_name": "update",  _id: node._id, "document": {clinical_trial_relations_count: 0}});
        });

        if (es_bulk.length)
            await es_db.bulk(es_bulk);

        page++;
        console.log(relations.count + "/" + page * limit);
    }
    while(result.length === limit)
};

let create_relations_and_type_hash = async() =>
{
    console.log("Creating Hash");
    let hash_file_name = `${__dirname}/relations_count_hash.json`;

    if (fs.existsSync(hash_file_name))
        return JSON.parse(fs.readFileSync(hash_file_name, "utf8"));

    let limit            = 1000;
    let version          = 7;
    let page             = 0;
    let result           = [];
    let db_index         = "converted";
    let relations_hash   = {};
    let types_hash       = {};

    let count = await mongo_db.read(db_index, {body: {version: {$ne: version}}, count_only: true});
    let projection = indexes.reduce((res, index_name) =>{
        let type = utils.get_node_type({_type: index_name});
        res[type + "_relations"] = 1;
        return res;
    }, {});

    do {
        result = await mongo_db.read(db_index, {body: {version: {$ne: version}}, size: limit, projection : {fields: projection}});
        result.forEach(trial => {
            let relation_ids = [];
            indexes.forEach(index =>
            {
                let type = utils.get_node_type({_type: index});
                let ids = trial[type + "_relations"] || [];
                relation_ids = relation_ids.concat(ids);
                ids.forEach(id => types_hash[id] = index)
            });
            relation_ids.forEach(id => {
                relations_hash[id] = relations_hash[id] || 0;
                relations_hash[id]++;
            });
        });
        await mongo_db.update_many(db_index, {query: {_id: {$in :result.map(({_id}) => _id) }}, data: {version: version}});

        page++;
        console.log(count + "/" + page * limit);
    }
    while(result.length === limit);

    let all_relation_ids = Object.keys(relations_hash);

    fs.writeFileSync(hash_file_name, JSON.stringify({all_relation_ids, relations_hash, types_hash}), "utf8");

    return {all_relation_ids, relations_hash, types_hash}
};

let update_clinical_trial_relations_count = async({all_relation_ids, relations_hash, types_hash}) =>
{
    console.log("Updating relations count");

    let limit = 1000;
    let page = 0;
    let es_bulk = [];

    all_relation_ids.forEach((id, index) =>
    {
        if (!relations_hash[id] || !types_hash[id])
            debugger;

        es_bulk.push({"model_title": types_hash[id], "command_name": "update",  _id: id, "document": {clinical_trial_relations_count: relations_hash[id]}});
    });

    do {

        let sub_bulk = es_bulk.slice(page * limit, page * limit + limit);
        if (sub_bulk.length)
            await es_db.bulk(sub_bulk);

        page ++;
        console.log(`${page * limit + limit}/${es_bulk.length}`);
    }
    while(page * limit + limit < es_bulk.length);
};

let start = async() =>
{
    await init_dbs();
    // await remove_old_relations_count();
    let {all_relation_ids, relations_hash, types_hash} = await create_relations_and_type_hash();
    await update_clinical_trial_relations_count({all_relation_ids, relations_hash, types_hash});
};

start()
.then(() => process.exit())
.catch(e => console.error(e));