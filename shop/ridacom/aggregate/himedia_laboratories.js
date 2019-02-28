let aggregate_product = async(mongo_db, crawler_db) =>
{
    let src = "himedia_laboratories";
    let type = "unclassified";

    console.log(`${type} all_category...`);
    let collection_name = `_agg_${src}_${type}_all_category`;
    await crawler_db.drop(collection_name);
    await crawler_db.aggregate("product", {match: {tid: "ridacom", src: src, type: type}, unwind: "categories", group: {_id : "$categories", total : {$sum : 1}}, out: collection_name, options: {allowDiskUse: true}});

    console.log(`${type} applications...`);
    collection_name = `_agg_${src}_${type}_applications`;
    await crawler_db.drop(collection_name);
    await crawler_db.aggregate("product", {match: {tid: "ridacom", src: src, type: type},  unwind: "applications", group: {_id : "$applications.type", total : {$sum : 1}}, out: collection_name, options: {allowDiskUse: true}});

    console.log(`${type} category...`);
    collection_name = `_agg_${src}_${type}_category`;
    await crawler_db.drop(collection_name);
    await crawler_db.aggregate("product", {match: {tid: "ridacom", src: src, type: type}, group: {_id : { $arrayElemAt: [ "$categories", 1 ] }, total : {$sum : 1}}, out: collection_name, options: {allowDiskUse: true}});

    console.log(`${type} sub_category...`);
    collection_name = `_agg_${src}_${type}_sub_category`;
    await crawler_db.drop(collection_name);
    await crawler_db.aggregate("product", {match: {tid: "ridacom", src: src, type: type}, group: {_id : { $arrayElemAt: [ "$categories", 2 ] }, total : {$sum : 1}}, out: collection_name, options: {allowDiskUse: true}});
};

let aggregate = async(mongo_db, crawler_db) =>
{
    console.log("Aggregate Himedia Laboratories:");
    await aggregate_product(mongo_db, crawler_db);
};

let clean = async(mongo_db) => {
    let src = "himedia_laboratories";
    let type = "unclassified";
    await mongo_db.drop(`_agg_${src}_${type}_category`);
    await mongo_db.drop(`_agg_${src}_${type}_sub_category`);
};

module.exports = {
    aggregate,
    clean
};