let aggregators = {
    cloud_clone: require("./aggregate/cloud_clone.js"),
    abbkine    : require("./aggregate/abbkine.js")
};

let aggregate = async(mongo_db, site) =>
{
    await aggregators[site].aggregate(mongo_db)

};


module.exports = aggregate;