let es_db    = require("../../_utils/elasticsearch/db.js");

let rel_version = 1;

let get_collection_name = (field) =>
{
    let type = field.replace("_relations", "");

    switch(type)
    {
        case "drug":
            return "drug_or_chemical";
        default:
            return type
    }
};

let relation_fields = [
    "affiliate_relations",
    "anatomy_relations",
    "disease_relations",
    "drug_relations",
    "gene_relations",
    "organism_relations",
    "process_relations",
    "pubmed_relations",
    "pathway_relations",
    "clinical_trial_relations"
];

let body = {
    "query" : {
        "bool" : {
            "must_not" : {
                "term": {"rel_version": rel_version}
            }
        }
    },
    "_source" : relation_fields
};

let collections = relation_fields.map(field => get_collection_name(field));

let run = async(collection_name) =>
{
    console.log(`Update ${collection_name} relations`);

    let result = [];
    let limit = 300;
    let page = 0;

    do {
        let es_bulk = [];
        let db_data = await es_db.read_unlimited(collection_name, {body: body, size: limit});
        result = db_data.data;
        let rel_hash = {};

        result.forEach(item => {
            relation_fields.forEach(field => {
                if (!item[field] || !item[field].length)
                    return;

                item[field].forEach(id => {
                    rel_hash[id] = rel_hash[id] || 0;
                    rel_hash[id]++
                })
            });
            es_bulk.push({"model_title": collection_name, "command_name": "update", "_id": item._id, "document": {rel_version: rel_version}});
        });

        let all_ids = Object.keys(rel_hash);

        let start_index = 0;
        let end_index = 0;
        let sub_step = 0;
        let sub_limit = 800;

        do {
            start_index = sub_step * sub_limit;
            end_index = start_index + sub_limit;
            let ids = all_ids.slice(start_index, end_index);

            let data = await es_db.read_unlimited(collections,{body: { "query" : {"terms": {"_id": ids}}, "_source" : ["patent_relations_count"]}, size: sub_limit, add_type: true});
            data.data.forEach(item =>{
                item.patent_relations_count = (item.patent_relations_count || 0) + rel_hash[item._id];
                es_bulk.push({"model_title": item._type, "command_name": "update", "_id": item._id, "document": {patent_relations_count: item.patent_relations_count}});
            });

            sub_step++
        }
        while(end_index < all_ids.length);

        if (es_bulk.length)
            await es_db.bulk(es_bulk);

        page++;
        console.log(`Update ${collection_name} relations ${page * limit}/${db_data.count}`);

    }
    while (result.length === limit)
};

module.exports = run;