let fs    = require("fs");
let utils = require("../../_utils/utils.js");

let version_patent_rel = 1;

let mongo_collection = "patent_justia";
let unknown_history_fields = {};

let build_index = async(mongo_db) =>
{
    console.log("Build enrich_patent indexes...");
    await mongo_db.create_index(mongo_collection, {data : {version_patent_rel: 1}});
    console.log("Indexes done");
};

let run = async (mongo_db) =>
{
    await build_index(mongo_db);

    let result    = [];
    let limit     = 500;
    let page      = 0;
    let found     = 0;
    let not_found = 0;

    let count = await mongo_db.read(mongo_collection, {body: {version_patent_rel :{$ne: version_patent_rel}}, count_only: true});

    do
    {
        let mongo_bulk = [];
        let related_hash = [];
        let ids = [];

        result = await mongo_db.read(mongo_collection, {body: {version_patent_rel :{$ne: version_patent_rel}}, size: limit});
        result.forEach(patent => {
            ids = ids.concat((patent.us_citation || []).map(({id}) => id))
        });
        ids = utils.uniq(ids);
        let related_data = await mongo_db.read(mongo_collection, {body: {_id : {$in: ids}}, size:ids.length});

        related_hash = related_data.reduce((res, item) =>
        {
            res[item._id] = item;
            return res
        }, {});

        result.forEach(patent => {
            let document =  {version_patent_rel : version_patent_rel};

            (patent.us_citation || []).forEach(item =>
            {
                if (related_hash[item.id])
                {
                    patent.patent_relations = patent.patent_relations || [];
                    patent.patent_relations.push(`PATENT:${item.id}`);
                    patent.patent_relations = utils.uniq(patent.patent_relations);
                    found++;
                }
                else
                {
                    not_found++;
                }
            });
            patent.patent_relations ? document.patent_relations = patent.patent_relations : null;
            patent.patent_relations ? document.patent_relations_count = patent.patent_relations.length : null;

            mongo_bulk.push({"command_name": "update", "_id": patent._id, "document": document})
        });

        if (mongo_bulk.length)
            await mongo_db.bulk(mongo_collection, mongo_bulk);

        page++;
        console.log(`Patent - Patent relations ${page * limit}/${count} - Found: ${found}/${not_found}`);
    }
    while(result.length === limit);

    fs.writeFileSync(__dirname + "/unknown.json", JSON.stringify(unknown_history_fields), "utf8")
};

module.exports = {
    run
};