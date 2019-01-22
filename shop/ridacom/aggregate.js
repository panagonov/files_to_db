let aggregate_cloud_clone = require("./aggregate/cloud_clone.js");

let aggregate = async(mongo_db, site) =>
{
    switch (site) {
        case "cloud_clone" :
            await aggregate_cloud_clone.aggregate(mongo_db);
            break;
    }
};


module.exports = aggregate;