let utils    = require("@bioseek/core/utilities/utils.js");
let Mongo_db = require("@crawler/_utils/db.js");
let config   = require('@bioseek/core/config.js');

let uniprot_db;
let collection_name = "uniprot";

let init = async() =>
{
    uniprot_db = new Mongo_db();
    let mongo_conf = utils.clone(config.get("crawler:authors:mongo_db"));
    mongo_conf.database = collection_name;

    await uniprot_db.init(mongo_conf);
};

let find_bio_objects = async(ids, field = "ids") => {
    let duplicated = [];

    let bio_objects = await uniprot_db.read(collection_name, {body: {[field] : {$in : ids}}});

    let hash = bio_objects.reduce((res, item) => {
        (item.ids || []).forEach(id => {
            if (res[id])
                duplicated.push(id);

            if (item.gene && item.gene[0])
            {
                item.symbol = item.gene[0]
            }
            else if(item.aliases && item.aliases[0])
            {
                item.symbol = item.aliases[0];
            }
            else
            {
                item.symbol = item.name
            }
            res[id] = item});
        return res;
    }, {});

    duplicated = utils.uniq(duplicated);

    return {hash, duplicated}
};

module.exports = {
    init,
    find_bio_objects
};