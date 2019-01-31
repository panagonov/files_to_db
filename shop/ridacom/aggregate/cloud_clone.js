let aggregate_antibodies = async(mongo_db) =>
{
    console.log("antibody host...");
    await mongo_db.drop("_agg_cloud_clone_antibody_host");
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: "cloud_clone", type: "antibody"}, group: {_id : "$host", total : {$sum : 1}}, out: "_agg_cloud_clone_antibody_host", options: {allowDiskUse: true}});

    console.log("antibody reactivity...");
    await mongo_db.drop("_agg_cloud_clone_antibody_reactivity");
    await mongo_db.aggregate("product", {unwind: "reactivity", match: {tid: "ridacom", src: "cloud_clone", type: "antibody"}, group: {_id : "$reactivity", total : {$sum : 1}}, out: "_agg_cloud_clone_antibody_reactivity", options: {allowDiskUse: true}});

    console.log("antibody application...");
    await mongo_db.drop("_agg_cloud_clone_antibody_application");
    await mongo_db.aggregate("product", {unwind: "application", match: {tid: "ridacom", src: "cloud_clone", type: "antibody"}, group: {_id : "$application", total : {$sum : 1}}, out: "_agg_cloud_clone_antibody_application", options: {allowDiskUse: true}});

    console.log("antibody isotype...");
    await mongo_db.drop("_agg_cloud_clone_antibody_isotype");
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: "cloud_clone", type: "antibody"}, group: {_id : "$isotype", total : {$sum : 1}}, out: "_agg_cloud_clone_antibody_isotype", options: {allowDiskUse: true}});

    console.log("antibody research_area...");
    await mongo_db.drop("_agg_cloud_clone_antibody_research_area");
    await mongo_db.aggregate("product", {unwind: "research_area", match: {tid: "ridacom", src: "cloud_clone", type: "antibody"}, group: {_id : "$research_area", total : {$sum : 1}}, out: "_agg_cloud_clone_antibody_research_area", options: {allowDiskUse: true}});

    console.log("antibody immunogen...");
    await mongo_db.drop("_agg_cloud_clone_antibody_immunogen");
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: "cloud_clone", type: "antibody"}, group: {_id : "$immunogen", total : {$sum : 1}}, out: "_agg_cloud_clone_antibody_immunogen", options: {allowDiskUse: true}});
};

let aggregate_elisa_kits = async(mongo_db) =>
{
    console.log("elisa_kit reactivity...");
    await mongo_db.drop("_agg_cloud_clone_elisa_kit_reactivity");
    await mongo_db.aggregate("product", {unwind: "reactivity", match: {tid: "ridacom", src: "cloud_clone", type: "elisa_kit"}, group: {_id : "$reactivity", total : {$sum : 1}}, out: "_agg_cloud_clone_elisa_kit_reactivity", options: {allowDiskUse: true}});

    console.log("elisa_kit application...");
    await mongo_db.drop("_agg_cloud_clone_elisa_kit_application");
    await mongo_db.aggregate("product", {unwind: "application", match: {tid: "ridacom", src: "cloud_clone", type: "elisa_kit"}, group: {_id : "$application", total : {$sum : 1}}, out: "_agg_cloud_clone_elisa_kit_application", options: {allowDiskUse: true}});

    console.log("elisa_kit method...");
    await mongo_db.drop("_agg_cloud_clone_elisa_kit_method");
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: "cloud_clone", type: "elisa_kit"}, group: {_id : "$method", total : {$sum : 1}}, out: "_agg_cloud_clone_elisa_kit_method", options: {allowDiskUse: true}});

    console.log("elisa_kit research_area...");
    await mongo_db.drop("_agg_cloud_clone_elisa_kit_research_area");
    await mongo_db.aggregate("product", {unwind: "research_area", match: {tid: "ridacom", src: "cloud_clone", type: "elisa_kit"}, group: {_id : "$research_area", total : {$sum : 1}}, out: "_agg_cloud_clone_elisa_kit_research_area", options: {allowDiskUse: true}});
};

let aggregate_protein = async(mongo_db) =>
{
    let src = "cloud_clone";
    let type = "protein";

    console.log(`${type} preparation_method...`);
    await mongo_db.drop(`_agg_${src}_${type}_host`);
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: src, type: type}, group: {_id : "$host", total : {$sum : 1}}, out: `_agg_${src}_${type}_host`, options: {allowDiskUse: true}});
};


let aggregate = async(mongo_db) =>
{
    console.log("Aggregate Cloud Clone:");
    await aggregate_antibodies(mongo_db);
    await aggregate_elisa_kits(mongo_db);
    await aggregate_protein(mongo_db);
};

module.exports = {
    aggregate
};