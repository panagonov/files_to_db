let aggregate_equipment = async(mongo_db, crawler_db) =>
{
    let src = "adam_equipment";
    let type = "equipment";

    console.log(`${type} sub_category...`);
    await crawler_db.drop(`_agg_${src}_${type}_sub_category`);
    await crawler_db.aggregate("product", {unwind: "sub_category", match: {tid: "ridacom", src: src, type: type}, group: {_id : "$sub_category", total : {$sum : 1}}, out: `_agg_${src}_${type}_sub_category`, options: {allowDiskUse: true}});

    console.log(`${type} parent_sub_category...`);
    await crawler_db.drop(`_agg_${src}_${type}_parent_sub_category`);
    await crawler_db.aggregate("product", {unwind: "parent_sub_category", match: {tid: "ridacom", src: src, type: type}, group: {_id : "$parent_sub_category", total : {$sum : 1}}, out: `_agg_${src}_${type}_parent_sub_category`, options: {allowDiskUse: true}});

    console.log(`${type} calibration...`);
    await crawler_db.drop(`_agg_${src}_${type}_calibration`);
    await crawler_db.aggregate("product", {match: {tid: "ridacom", src: src, type: type}, group: {_id : "$specifications.Calibration", total : {$sum : 1}}, out: `_agg_${src}_${type}_calibration`, options: {allowDiskUse: true}});
};

let aggregate = async(mongo_db, crawler_db) =>
{
    console.log("Aggregate Adam Equipment:");
    await aggregate_equipment(mongo_db, crawler_db);
};

let clean = async(mongo_db, crawler_db) => {
    let src = "adam_equipment";
    let type = "equipment";
    await crawler_db.drop(`_agg_${src}_${type}_sub_category`);
    await crawler_db.drop(`_agg_${src}_${type}_parent_sub_category`);
    await crawler_db.drop(`_agg_${src}_${type}_calibration`);

};

module.exports = {
    aggregate,
    clean
};