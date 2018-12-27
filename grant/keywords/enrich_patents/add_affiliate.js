let keywords_builder = require("../keywords_builder.js");
let collection_name = "patents";

let add_affiliate = async (version, mongo_db) =>
{
    console.log("Add patent affiliate relations");

    let result = [];
    let limit = 1000;
    let page = 0;

    let count = await mongo_db.read(collection_name, {body: {version: {$ne : version}}, count_only: true});

    do {
        let mongo_bulk      = [];
        let found           = 0, not_found = 0;
        let affiliate_found = 0, affiliate_not_found = 0;
        result              = await mongo_db.read(collection_name, {body: {version: {$ne: version}}, size: limit});

        result.forEach(item =>
        {
            let affiliate = keywords_builder.get(item.org_name.trim().toLowerCase());
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
                item._affiliate_not_found.push(item.org_name.trim().toLowerCase());
                item._affiliate_not_found = item._affiliate_not_found.reduce((res, item) =>
                {
                    if (res.indexOf(item) === -1)
                        res.push(item);
                    return res
                }, []);
                document._affiliate_not_found = item._affiliate_not_found;
            }
        });

        page++;
        console.log(`Keywords ${page * limit}/${count} - found: ${found}/${not_found} aff: ${affiliate_found}/${affiliate_not_found}`);
    }
    while(result.length === limit);

};