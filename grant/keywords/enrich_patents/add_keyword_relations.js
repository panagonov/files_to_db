let utils            = require("../../../_utils/utils.js");

let collection_name = "patents";
let version_keywords = 1;

let build_index = async(mongo_db) =>
{
    await mongo_db.create_index(collection_name, {data : {version_keywords: 1}});
};

let add_keyword_relations = async (mongo_db) =>
{
    console.log("Add patent keyword relations");
    await build_index(mongo_db);

    let result = [];
    let limit = 10;
    let page = 0;

    let count = await mongo_db.read(collection_name, {body: {version_keywords: {$ne : version_keywords}}, count_only: true});

    do {
        let mongo_bulk = [];
        result = await mongo_db.read(collection_name, {body: {version_keywords: {$ne: version_keywords}}, size: limit});

        let projects = await mongo_db.read("projects", {body: {patent_relations: {$in: result.map(item => item._id)}}});

        let map_hash = projects.reduce((res, item) => {
            item.patent_relations.forEach(id => {
                res[id] = res[id] || [];
                res[id].push(item)
            });
            return res
        }, {});

        result.forEach(item =>
        {
            let document = {
                version_keywords: version_keywords
            };

            let related_projects = map_hash[item._id];

            if (related_projects && related_projects.length)
            {
                related_projects.forEach(project =>{
                    ["pubmed", "affiliate", "disease", "drug", "pathway", "process", "organism", "anatomy", "gene", "clinical_trial"].forEach(key => {
                        item[key + "_relations"] = utils.uniq((item[key + "_relations"] || []).concat(project[key + "_relations"] || []));
                        if (item[key + "_relations"].length)
                        {
                            project[key + "_relations"] ? document[key + "_relations"] = item[key + "_relations"] : null;
                            project[key + "_relations_count"] ? document[key + "_relations_count"] = document[key + "_relations"].length : null;
                        }
                    });

                    item.grant_relations = utils.uniq((item.grant_relations || []).concat([project._id]));
                    document.grant_relations = item.grant_relations;
                    document.grant_relations_count = document.grant_relations.length
                })
            }

            mongo_bulk.push({command_name: "update", _id: item._id, document: document})
        });

        if (mongo_bulk.length)
            await mongo_db.bulk(collection_name, mongo_bulk);

        page++;
        console.log(`Keywords in patents ${page * limit}/${count}`);
    }
    while(result.length === limit);
};

module.exports = add_keyword_relations;