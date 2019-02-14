let aggregate_antibodies = async(mongo_db) =>
{
    let src = "cloud_clone";
    let type = "antibody";

    console.log(`${type} host...`);
    await mongo_db.drop(`_agg_${src}_${type}_host`);
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: src, type: type}, group: {_id : "$host", total : {$sum : 1}}, out: `_agg_${src}_${type}_host`, options: {allowDiskUse: true}});

    console.log(`${type} reactivity...`);
    await mongo_db.drop(`_agg_${src}_${type}_reactivity`);
    await mongo_db.aggregate("product", {unwind: "reactivity", match: {tid: "ridacom", src: src, type: type}, group: {_id : "$reactivity", total : {$sum : 1}}, out: `_agg_${src}_${type}_reactivity`, options: {allowDiskUse: true}});

    console.log(`${type} application...`);
    await mongo_db.drop(`_agg_${src}_${type}_application`);
    await mongo_db.aggregate("product", {unwind: "application", match: {tid: "ridacom", src: src, type: type}, group: {_id : "$application", total : {$sum : 1}}, out: `_agg_${src}_${type}_application`, options: {allowDiskUse: true}});

    console.log(`${type} isotype...`);
    await mongo_db.drop(`_agg_${src}_${type}_isotype`);
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: src, type: type}, group: {_id : "$isotype", total : {$sum : 1}}, out: `_agg_${src}_${type}_isotype`, options: {allowDiskUse: true}});

    console.log(`${type} research_area...`);
    await mongo_db.drop(`_agg_${src}_${type}_research_area`);
    await mongo_db.aggregate("product", {unwind: "research_area", match: {tid: "ridacom", src: src, type: type}, group: {_id : "$research_area", total : {$sum : 1}}, out: `_agg_${src}_${type}_research_area`, options: {allowDiskUse: true}});

    console.log(`${type} immunogen...`);
    await mongo_db.drop(`_agg_${src}_${type}_immunogen`);
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: src, type: type}, group: {_id : "$immunogen", total : {$sum : 1}}, out: `_agg_${src}_${type}_immunogen`, options: {allowDiskUse: true}});
};

let aggregate_elisa_kits = async(mongo_db) =>
{
    let src = "cloud_clone";
    let type = "elisa_kit";

    console.log(`${type} reactivity...`);
    await mongo_db.drop(`_agg_${src}_${type}_reactivity`);
    await mongo_db.aggregate("product", {unwind: "reactivity", match: {tid: "ridacom", src: src, type: type}, group: {_id : "$reactivity", total : {$sum : 1}}, out: `_agg_${src}_${type}_reactivity`, options: {allowDiskUse: true}});

    console.log(`${type} application...`);
    await mongo_db.drop(`_agg_${src}_${type}_application`);
    await mongo_db.aggregate("product", {unwind: "application", match: {tid: "ridacom", src: src, type: type}, group: {_id : "$application", total : {$sum : 1}}, out: `_agg_${src}_${type}_application`, options: {allowDiskUse: true}});

    console.log(`${type} method...`);
    await mongo_db.drop(`_agg_${src}_${type}_method`);
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: src, type: type}, group: {_id : "$method", total : {$sum : 1}}, out: `_agg_${src}_${type}_method`, options: {allowDiskUse: true}});

    console.log(`${type} research_area...`);
    await mongo_db.drop(`_agg_${src}_${type}_research_area`);
    await mongo_db.aggregate("product", {unwind: "research_area", match: {tid: "ridacom", src: src, type: type}, group: {_id : "$research_area", total : {$sum : 1}}, out: `_agg_${src}_${type}_research_area`, options: {allowDiskUse: true}});
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

let clean = async(mongo_db) => {
    let src = "cloud_clone";
    let type = "antibody";
    await mongo_db.drop(`_agg_${src}_${type}_host`);
    await mongo_db.drop(`_agg_${src}_${type}_reactivity`);
    await mongo_db.drop(`_agg_${src}_${type}_application`);
    await mongo_db.drop(`_agg_${src}_${type}_isotype`);
    await mongo_db.drop(`_agg_${src}_${type}_research_area`);
    await mongo_db.drop(`_agg_${src}_${type}_immunogen`);

    type = "elisa_kit";
    await mongo_db.drop(`_agg_${src}_${type}_reactivity`);
    await mongo_db.drop(`_agg_${src}_${type}_application`);
    await mongo_db.drop(`_agg_${src}_${type}_method`);
    await mongo_db.drop(`_agg_${src}_${type}_research_area`);

    type = "protein";
    await mongo_db.drop(`_agg_${src}_${type}_host`);
};

module.exports = {
    aggregate,
    clean
};