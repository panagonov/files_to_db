let keywords_builder = require("../keywords_builder.js");

let build_index = async(mongo_db, target_collection) =>
{
    await mongo_db.create_index(target_collection, {data : {version: 1}});
    await mongo_db.create_index(target_collection, {data : {core_project_num: 1}});
};

let type_map = (type) =>
{
    switch(type)
    {
        case "drug_or_chemical":
            return "drug";
        default:
            return type;
    }
};

let add_keywords_relations = async(version, target_collection, mongo_db) =>
{
    console.log("Add keyword relations");
    await build_index(mongo_db, target_collection);

    let result = [];
    let limit = 1000;
    let page = 0;

    let count = await mongo_db.read(target_collection, {body: {version: {$ne : version}}, count_only: true});

    do {
        let mongo_bulk = [];
        let found = 0, not_found = 0;
        let affiliate_found = 0, affiliate_not_found = 0;
        result = await mongo_db.read(target_collection, {body: {version: {$ne : version}}, size: limit});

        result.forEach(item => {
            let document = {
                version: version
            };
            (item.terms || []).forEach(term => {
                if (!term || !term.trim())
                    return;

                let relation = keywords_builder.get(term.trim().toLowerCase());
                if (relation) {
                    found++;
                    let key = type_map(relation._type) +"_relations";
                    let count_key = relation._type +"_relations_count";
                    item[key] = item[key] || [];
                    item[key].push(relation._id);
                    document[key] = item[key];
                    document[count_key] = item[key].length;
                }
                else {
                    not_found++;
                    item._terms_not_found = item._terms_not_found || [];
                    item._terms_not_found.push(term);
                    document._terms_not_found = item._terms_not_found;
                }
            });
            if (item.org_name)
            {
                let affiliate = keywords_builder.get(item.org_name.trim().toLowerCase());
                if (affiliate)
                {
                    affiliate_found++;
                    let key = affiliate._type +"_relations";
                    let count_key = type_map(affiliate._type) +"_relations_count";
                    item[key] = item[key] || [];
                    item[key].push(affiliate._id);
                    document[key] = item[key];
                    document[count_key] = item[key].length;
                }
                else {
                    affiliate_not_found++;
                    item._affiliate_not_found = item._affiliate_not_found || [];
                    item._affiliate_not_found.push(item.org_name.trim().toLowerCase());
                    document._affiliate_not_found = item._affiliate_not_found;
                }
            }

            mongo_bulk.push({command_name: "update", _id: item._id, document: document})
        });

        if (mongo_bulk.length)
            await mongo_db.bulk(target_collection, mongo_bulk);

        page++;
        console.log(`Keywords ${page * limit}/${count} - found: ${found}/${not_found} aff: ${affiliate_found}/${affiliate_not_found}`);

    }
    while(result.length === limit)
};

module.exports = add_keywords_relations;