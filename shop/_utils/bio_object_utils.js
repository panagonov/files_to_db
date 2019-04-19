let utils        = require("../../_utils/utils.js");
let Mongo_db     = require("../../_utils/db.js");

let uniprot_db;
let collection_name = "uniprot";

let init = async() =>
{
    uniprot_db = new Mongo_db();
    await uniprot_db.init({database: collection_name});
};

let find_bio_objects = async(result) => {
    let duplicated = [];

    let ids = utils.uniq(result
        .map(item => item.accession)
        .filter(id => id)
        .reduce((res, id) => {
            res = res.concat(id.split("/"));
            res = res.map(it => it.trim().split("-").shift());
            return res
        }, [])
    );
    let bio_objects = await uniprot_db.read(collection_name, {body: {ids : {$in : ids}}});

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