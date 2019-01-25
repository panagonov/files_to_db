let aggregate = async(mongo_db) =>
{
    console.log("Aggregate Abbkine:");
    console.log("host...");
    await mongo_db.drop("_agg_abbkine_antibody_host");
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: "abbkine", type: "antibody"}, group: {_id : "$host", total : {$sum : 1}}, out: "_agg_abbkine_antibody_host", options: {allowDiskUse: true}});
    console.log("reactivity...");
    await mongo_db.drop("_agg_abbkine_antibody_reactivity");
    await mongo_db.aggregate("product", {unwind: "reactivity", match: {tid: "ridacom", src: "abbkine", type: "antibody"}, group: {_id : "$reactivity", total : {$sum : 1}}, out: "_agg_abbkine_antibody_reactivity", options: {allowDiskUse: true}});
    console.log("application...");
    await mongo_db.drop("_agg_abbkine_antibody_application");
    await mongo_db.aggregate("product", {unwind: "application", match: {tid: "ridacom", src: "abbkine", type: "antibody"}, group: {_id : "$application", total : {$sum : 1}}, out: "_agg_abbkine_antibody_application", options: {allowDiskUse: true}});
    console.log("isotype...");
    await mongo_db.drop("_agg_abbkine_antibody_isotype");
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: "abbkine", type: "antibody"}, group: {_id : "$isotype", total : {$sum : 1}}, out: "_agg_abbkine_antibody_isotype", options: {allowDiskUse: true}});
    console.log("immunogen...");
    await mongo_db.drop("_agg_abbkine_antibody_immunogen");
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: "abbkine", type: "antibody"}, group: {_id : "$immunogen", total : {$sum : 1}}, out: "_agg_abbkine_antibody_immunogen", options: {allowDiskUse: true}});
    console.log("conjugate...");
    await mongo_db.drop("_agg_abbkine_antibody_conjugate");
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: "abbkine", type: "antibody"}, group: {_id : "$conjugate", total : {$sum : 1}}, out: "_agg_abbkine_antibody_conjugate", options: {allowDiskUse: true}});


};

module.exports = {
    aggregate
};