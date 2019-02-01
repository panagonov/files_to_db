let aggregators = {
    cloud_clone: require("./aggregate/cloud_clone.js"),
    abbkine    : require("./aggregate/abbkine.js"),
    capp    : require("./aggregate/capp.js")
};

let aggregate = async(mongo_db, crawler_db, site) =>
{
    await aggregators[site].aggregate(mongo_db, crawler_db)

};


module.exports = aggregate;