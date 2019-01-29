let aggregate_antibody = async(mongo_db) =>
{
    console.log("antibody host...");
    await mongo_db.drop("_agg_abbkine_antibody_host");
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: "abbkine", type: "antibody"}, group: {_id : "$host", total : {$sum : 1}}, out: "_agg_abbkine_antibody_host", options: {allowDiskUse: true}});

    console.log("antibody reactivity...");
    await mongo_db.drop("_agg_abbkine_antibody_reactivity");
    await mongo_db.aggregate("product", {unwind: "reactivity", match: {tid: "ridacom", src: "abbkine", type: "antibody"}, group: {_id : "$reactivity", total : {$sum : 1}}, out: "_agg_abbkine_antibody_reactivity", options: {allowDiskUse: true}});

    console.log("antibody application...");
    await mongo_db.drop("_agg_abbkine_antibody_application");
    await mongo_db.aggregate("product", {unwind: "application", match: {tid: "ridacom", src: "abbkine", type: "antibody"}, group: {_id : "$application", total : {$sum : 1}}, out: "_agg_abbkine_antibody_application", options: {allowDiskUse: true}});

    console.log("antibody isotype...");
    await mongo_db.drop("_agg_abbkine_antibody_isotype");
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: "abbkine", type: "antibody"}, group: {_id : "$isotype", total : {$sum : 1}}, out: "_agg_abbkine_antibody_isotype", options: {allowDiskUse: true}});

    console.log("antibody immunogen...");
    await mongo_db.drop("_agg_abbkine_antibody_immunogen");
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: "abbkine", type: "antibody"}, group: {_id : "$immunogen", total : {$sum : 1}}, out: "_agg_abbkine_antibody_immunogen", options: {allowDiskUse: true}});

    console.log("antibody conjugate...");
    await mongo_db.drop("_agg_abbkine_antibody_conjugate");
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: "abbkine", type: "antibody"}, group: {_id : "$conjugate", total : {$sum : 1}}, out: "_agg_abbkine_antibody_conjugate", options: {allowDiskUse: true}});
};

let aggregate_elisa_kits = async(mongo_db) =>
{
    console.log("elisa_kit reactivity...");
    await mongo_db.drop("_agg_cloud_clone_elisa_kit_reactivity");
    await mongo_db.aggregate("product", {unwind: "reactivity", match: {tid: "ridacom", src: "cloud_clone", type: "elisa_kit"}, group: {_id : "$reactivity", total : {$sum : 1}}, out: "_agg_cloud_clone_elisa_kit_reactivity", options: {allowDiskUse: true}});

    console.log("elisa_kit type...");
    await mongo_db.drop("_agg_cloud_clone_elisa_kit_type");
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: "cloud_clone", type: "elisa_kit"}, group: {_id : "$assay_type", total : {$sum : 1}}, out: "_agg_cloud_clone_elisa_kit_type", options: {allowDiskUse: true}});

    console.log("elisa_kit conjugate...");
    await mongo_db.drop("_agg_cloud_clone_elisa_kit_conjugate");
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: "cloud_clone", type: "elisa_kit"}, group: {_id : "$conjugate", total : {$sum : 1}}, out: "_agg_cloud_clone_elisa_kit_conjugate", options: {allowDiskUse: true}});
};

let aggregate = async(mongo_db) =>
{
    console.log("Aggregate Abbkine:");
    await aggregate_antibody(mongo_db);
    await aggregate_elisa_kits(mongo_db);
};

module.exports = {
    aggregate
};