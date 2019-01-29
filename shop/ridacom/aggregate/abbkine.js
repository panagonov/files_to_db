let aggregate_antibody = async(mongo_db) =>
{
    let src = "abbkine";
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

    console.log(`${type} immunogen...`);
    await mongo_db.drop(`_agg_${src}_${type}_immunogen`);
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: src, type: type}, group: {_id : "$immunogen", total : {$sum : 1}}, out: `_agg_${src}_${type}_immunogen`, options: {allowDiskUse: true}});

    console.log(`${type} conjugate...`);
    await mongo_db.drop(`_agg_${src}_${type}_conjugate`);
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: src, type: type}, group: {_id : "$conjugate", total : {$sum : 1}}, out: `_agg_${src}_${type}_conjugate`, options: {allowDiskUse: true}});
};

let aggregate_elisa_kits = async(mongo_db) =>
{
    let src = "abbkine";
    let type = "elisa_kit";

    console.log(`${type} reactivity...`);
    await mongo_db.drop(`_agg_${src}_${type}_reactivity`);
    await mongo_db.aggregate("product", {unwind: "reactivity", match: {tid: "ridacom", src: src, type: type}, group: {_id : "$reactivity", total : {$sum : 1}}, out: `_agg_${src}_${type}_reactivity`, options: {allowDiskUse: true}});

    console.log(`${type} type...`);
    await mongo_db.drop(`_agg_${src}_${type}_type`);
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: src, type: type}, group: {_id : "$assay_type", total : {$sum : 1}}, out: `_agg_${src}_${type}_type`, options: {allowDiskUse: true}});

    console.log(`${type} conjugate...`);
    await mongo_db.drop(`_agg_${src}_${type}_conjugate`);
    await mongo_db.aggregate("product", {match: {tid: "ridacom", src: src, type: type}, group: {_id : "$conjugate", total : {$sum : 1}}, out: `_agg_${src}_${type}_conjugate`, options: {allowDiskUse: true}});
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