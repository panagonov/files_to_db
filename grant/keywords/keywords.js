let keywords_builder = require("./keywords_builder.js");

let mongo_db;
let target_collection = "projects";

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

let build_index = async() =>
{
    await mongo_db.create_index(target_collection, {data : {version: 1}});
    await mongo_db.create_index(target_collection, {data : {core_project_num: 1}});
    await mongo_db.create_index("patents", {data : {version: 1}});
};


let add_relations_by_keywords = async() =>
{
    let result = [];
    let limit = 1000;
    let page = 0;
    let version = 1;
    let count = await mongo_db.read(target_collection, {body: {version: {$ne : version}}, count_only: true});

    do {
        let mongo_bulk = [];
        let found = 0, not_found = 0;
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
                    document[key] = document[key] || [];
                    document[key].push(relation._id);
                    document[count_key] = document[count_key] || 0;
                    document[count_key]++
                }
                else {
                    not_found++;
                    document._terms_not_found = document._terms_not_found || [];
                    document._terms_not_found.push(term)
                }
            });
            if (item.org_name)
            {
                let affiliate = keywords_builder.get(item.org_name.trim().toLowerCase());
                if (affiliate)
                {
                    let key = affiliate._type +"_relations";
                    let count_key = type_map(affiliate._type) +"_relations_count";
                    document[key] = document[key] || [];
                    document[key].push(affiliate._id);
                    document[count_key] = document[count_key] || 0;
                    document[count_key]++
                }
                else {
                    document._affiliate_not_found = item.org_name.trim().toLowerCase();
                }
            }

            mongo_bulk.push({command_name: "update", _id: item._id, document: document})
        });

        if (mongo_bulk.length)
            await mongo_db.bulk(target_collection, mongo_bulk);

        page++;
        console.log(`Keywords ${page * limit}/${count} - found: ${found}; not found: ${not_found}`);

    }
    while(result.length === limit)
};

let add_patents = async() =>
{
    console.log("Add patents");

    let result = [];
    let limit = 100;
    let page = 0;
    let version = 1;
    let count = await mongo_db.read("patents", {body: {version: {$ne : version}}, count_only: true});

    do {
        let mongo_bulk = [];
        result = await mongo_db.read("patents", {body: {version: {$ne : version}}, size: limit});
        let map_hash = result.reduce((res, item) => {
            res[item.project_id] = item;
            return res;
        }, {});

        let projects = await mongo_db.read(target_collection, {body: {core_project_num: {$in : Object.keys(map_hash)}}});

        projects.forEach(item => {
            let document = {
                patent: map_hash[item.core_project_num]
            };
            mongo_bulk.push({command_name: "update", _id: item._id, document: document})
        });

        if (mongo_bulk.length)
            await mongo_db.bulk(target_collection, mongo_bulk);

        await mongo_db.update_many("patents", {
            query: {_id: {$in: result.map(({_id}) => _id)}},
            data: {version:  version}
        });

        page++;
        console.log(`Keywords ${page * limit}/${count}`);
    }
    while(result.length === limit)
};

let keywords = async(db) =>
{
    mongo_db = db;
    await build_index();
    await keywords_builder.build_hash();
    await add_relations_by_keywords();
    await add_patents();

};

module.exports = keywords;