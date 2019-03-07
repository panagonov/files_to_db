let aggregate_product = async(mongo_db, crawler_db) =>
{
    let src = "capp";
    let type = "equipment";

    console.log(`${type} category...`);
    let collection_name = `_agg_${src}_${type}_category`;
    await mongo_db.drop(collection_name);
    let category = await crawler_db.aggregate("product", {match: {tid: "ridacom", src: src, type: type}, group: {_id : "$category", total : {$sum : 1}}});

    let mongo_bulk = category.map(item =>({command_name: "upsert", _id: item._id, document: {total: item.total}}));
    await mongo_db.bulk(collection_name, mongo_bulk);

    console.log(`${type} sub_category...`);
    collection_name = `_agg_${src}_${type}_sub_category`;
    await mongo_db.drop(collection_name);
    let sub_category = await crawler_db.aggregate("product", {match: {tid: "ridacom", src: src, type: type}, group: {_id : "$sub_category", total : {$sum : 1}}});

    mongo_bulk = sub_category.map(item =>({command_name: "upsert", _id: item._id, document: {total: item.total}}));
    await mongo_db.bulk(collection_name, mongo_bulk);

    console.log(`${type} sub_sub_category...`);
    collection_name = `_agg_${src}_${type}_sub_sub_category`;
    await mongo_db.drop(collection_name);
    let sub_sub_category = await crawler_db.aggregate("product", {match: {tid: "ridacom", src: src, type: type}, group: {_id : "$sub_sub_category", total : {$sum : 1}}});

    mongo_bulk = sub_sub_category.map(item =>({command_name: "upsert", _id: item._id, document: {total: item.total}}));
    await mongo_db.bulk(collection_name, mongo_bulk);
};

let aggregate = async(mongo_db, crawler_db) =>
{
    console.log("Aggregate CAPP:");
    await aggregate_product(mongo_db, crawler_db);
};

let clean = async(mongo_db) => {
    let src = "capp";
    let type = "equipment";
    await mongo_db.drop(`_agg_${src}_${type}_category`);
    await mongo_db.drop(`_agg_${src}_${type}_sub_category`);
};

module.exports = {
    aggregate,
    clean
};