let keywords_builder = require("../keywords_builder.js");
let utils            = require("../../../_utils/utils.js");

let collection_name = "patents";
let version_affiliate = 1;

let build_index = async(mongo_db) =>
{
    await mongo_db.create_index(collection_name, {data : {version_affiliate: 1}});
};

let add_affiliate = async (mongo_db) =>
{
    console.log("Add patent affiliate relations");
    await build_index(mongo_db);

    let result = [];
    let limit = 1000;
    let page = 0;

    let count = await mongo_db.read(collection_name, {body: {version_affiliate: {$ne : version_affiliate}}, count_only: true});

    do {
        let mongo_bulk      = [];
        let affiliate_found = 0, affiliate_not_found = 0;
        result              = await mongo_db.read(collection_name, {body: {version_affiliate: {$ne: version_affiliate}}, size: limit});

        result.forEach(item =>
        {
            let document = {
                version_affiliate: version_affiliate
            };

            item.grant_relations = item.grant_relations || [];
            item.grant_relations.push(item.project_id);
            item.grant_relations = utils.uniq(item.grant_relations);

            let affiliate = keywords_builder.get((item.organization_name || "").trim().toLowerCase());
            if (affiliate)
            {
                affiliate_found++;
                let key = "affiliate_relations";
                let count_key = "affiliate_relations_count";
                item[key] = item[key] || [];
                item[key].push(affiliate._id);
                document[key] = item[key];
                document[count_key] = item[key].length;
            }
            else {
                affiliate_not_found++;
                item._affiliate_not_found = item._affiliate_not_found || [];
                item._affiliate_not_found.push(item.organization_name);
                item._affiliate_not_found = utils.uniq(item._affiliate_not_found);
                document._affiliate_not_found = item._affiliate_not_found;
            }

            mongo_bulk.push({command_name: "update", _id: item._id, document: document})
        });

        if (mongo_bulk.length)
            await mongo_db.bulk(collection_name, mongo_bulk);

        page++;
        console.log(`Affiliate in patents ${page * limit}/${count} - aff found: ${affiliate_found}/${affiliate_not_found}`);
    }
    while(result.length === limit);
};

module.exports = add_affiliate;