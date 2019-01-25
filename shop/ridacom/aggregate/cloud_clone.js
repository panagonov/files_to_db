let aggregate = async(mongo_db) =>
{
    console.log("Aggregate Cloud Clone:");
    console.log("host...");
    await mongo_db.drop("_agg_cloud_clone_antibody_host");
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: "cloud_clone", type: "antibody"}, group: {_id : "$host", total : {$sum : 1}}, out: "_agg_cloud_clone_antibody_host", options: {allowDiskUse: true}});
    console.log("reactivity...");
    await mongo_db.drop("_agg_cloud_clone_antibody_reactivity");
    await mongo_db.aggregate("product", {unwind: "reactivity", match: {tid: "ridacom", src: "cloud_clone", type: "antibody"}, group: {_id : "$reactivity", total : {$sum : 1}}, out: "_agg_cloud_clone_antibody_reactivity", options: {allowDiskUse: true}});
    console.log("application...");
    await mongo_db.drop("_agg_cloud_clone_antibody_application");
    await mongo_db.aggregate("product", {unwind: "application", match: {tid: "ridacom", src: "cloud_clone", type: "antibody"}, group: {_id : "$application", total : {$sum : 1}}, out: "_agg_cloud_clone_antibody_application", options: {allowDiskUse: true}});
    console.log("isotype...");
    await mongo_db.drop("_agg_cloud_clone_antibody_isotype");
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: "cloud_clone", type: "antibody"}, group: {_id : "$isotype", total : {$sum : 1}}, out: "_agg_cloud_clone_antibody_isotype", options: {allowDiskUse: true}});
    console.log("research_area...");
    await mongo_db.drop("_agg_cloud_clone_antibody_research_area");
    await mongo_db.aggregate("product", {unwind: "research_area", match: {tid: "ridacom", src: "cloud_clone", type: "antibody"}, group: {_id : "$research_area", total : {$sum : 1}}, out: "_agg_cloud_clone_antibody_research_area", options: {allowDiskUse: true}});
    console.log("immunogen...");
    await mongo_db.drop("_agg_cloud_clone_antibody_immunogen");
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: "cloud_clone", type: "antibody"}, group: {_id : "$immunogen", total : {$sum : 1}}, out: "_agg_cloud_clone_antibody_immunogen", options: {allowDiskUse: true}});
};

module.exports = {
    aggregate
};