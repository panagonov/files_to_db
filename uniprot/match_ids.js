require('module-alias/register');
let fs = require("fs");
let MongoDb     = require("@crawler/_utils/db.js");
let es_db       = require("@bioseek/core/db/elasticsearch/db");

let db_name  = "uniprot";
let mongo_db;

let init = async () =>
{
    await es_db.init();
    mongo_db = new MongoDb();
    await mongo_db.init({host: "localhost", database: db_name, user: "hashstyle", "pass" : "Ha5h5tylE"});
};

let run = async () =>
{
    await init();

    let limit = 500;
    let page = 1;
    let result = [];

    do {
        result = await mongo_db.read("uniprot", {body: {}, size: limit, page: page});

        let ids = result.map(item => item._id);

        let db_data = await es_db.read_unlimited("gene", {body : {query : {terms: {_id : ids}}, _source: ["_id"]}, size: ids.length});
        let found_ids = db_data.data.map(({_id}) => _id);

        let mongo_bulk = result.reduce((res, item) => {
            if (found_ids.indexOf(item._id) !== -1) {
                res.push({command_name: "update", _id: item._id, document: {oid: item._id}})
            }
            return res
        }, []);

        if (mongo_bulk.length)
            await mongo_db.bulk("uniprot", mongo_bulk);

        console.log((page - 1) * limit + result.length);
        page++
    }while(result.length === limit)
};


run().then(() => process.exit(0)).catch(e => console.error(e));
