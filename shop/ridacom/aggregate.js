let fs               = require('fs');
let directory_reader = require("../../_utils/directory_reader.js");
let progress         = require("./_cache/aggregate_progress.json");

let aggregators = directory_reader(`${__dirname}/aggregate/`, "js");

let run = async(mongo_db, crawler_db, site) =>
{
    if (aggregators[site] && !progress[site])
    {
        await aggregators[site].aggregate(mongo_db, crawler_db);
        progress[site] = 1;
        fs.writeFileSync(__dirname + "/_cache/aggregate_progress.json", JSON.stringify(progress), "utf8");
    }
};

let clean = async (mongo_db)=>
{
    fs.writeFileSync(__dirname + "/aggregate_progress.json", "{}", "utf8");

    for (let key in aggregators)
    {
        if (aggregators[key].clean) {
            aggregators[key].clean(mongo_db)
        }
    }
};


module.exports = {
    run,
    clean
};