let find_affiliate_by_keywords  = require("./utils/find_affiliate_by_keywords.js");

let collection_name = "_patent_aff_not_found";
let version = 1;

let build_index = async(mongo_db) =>
{
    console.log("Build indexes...");
    await mongo_db.create_index(collection_name, {data : {version: 1}});
    console.log("Indexes done");
};

let run = async(mongo_db, hash) =>
{
    await build_index(mongo_db);

    let result = [];
    let page = 0;
    let limit = 1000;
    let found =0, not_found = 0;
    let count = await mongo_db.read(collection_name, {body: {version :{$ne: version}}, count_only: true});

    do {
        let mongo_bulk = [];
        result = await mongo_db.read(collection_name, {body: {version :{$ne: version}}, size: limit});

        result.forEach(item =>
        {
            let document = {version : version};
            let res = {institution : [item._id /*"vibrato medical, inc."*/]};
            res = find_affiliate_by_keywords.run({aff_data: res, hash});
            if (res.affiliate) {
                found++;
                document.affiliate = res.affiliate.map(name => hash.affiliate[name]._id)[0];
            }
            else
                not_found++;

            mongo_bulk.push({command_name: "update", _id: item._id, document: document});
        });

        if (mongo_bulk.length)
            await mongo_db.bulk(collection_name, mongo_bulk);
        page++;
        console.log(`Patent affiliates match ${page * limit}/${count} - found: ${found}/${not_found}`);
    }
    while (result.length === limit)
};


module.exports = {
    run
};