let utils            = require("../../../_utils/utils.js");

let collection_name = "patents";
let version_external_links = 1;

let build_index = async(mongo_db) =>
{
    await mongo_db.create_index(collection_name, {data : {version_external_links: 1}});
};

let add_external_links = async (mongo_db) =>
{
    console.log("Add patent external links");
    await build_index(mongo_db);

    let result = [];
    let limit = 1000;
    let page = 0;

    let count = await mongo_db.read(collection_name, {body: {version_external_links: {$ne : version_external_links}}, count_only: true});

    do {
        let mongo_bulk = [];
        result = await mongo_db.read(collection_name, {body: {version_external_links: {$ne: version_external_links}}, size: limit});

        result.forEach(item =>
        {
            let document = {
                version_external_links: version_external_links
            };

            item.external_links = item.external_links || [];
            item.external_links.push({key: "JUSTIA", id: item._id});

            item.external_links = utils.uniq(item.external_links, (arr) => {
                return arr.reduce((res, item) => {
                    if(!res.some(it => it.key === item.key))
                        res.push(item);
                    return res
                }, [])
            });

            document.external_links = item.external_links;

            mongo_bulk.push({command_name: "update", _id: item._id, document: document})
        });

        if (mongo_bulk.length)
            await mongo_db.bulk(collection_name, mongo_bulk);

        page++;
        console.log(`External Links ${page * limit}/${count}`);
    }
    while(result.length === limit);
};

module.exports = add_external_links;