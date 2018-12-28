let collection_name = "patents";
let target_collection = "_patent_aff_not_found";

let build_index = async(mongo_db) =>
{
    console.log("Build indexes...");
    await mongo_db.create_index(collection_name, {data : {_affiliate_not_found: 1}});
    console.log("Indexes done");
};

let run = async(mongo_db) =>
{
    console.log("Create patent affiliate not found aggs");
    await build_index();
    await mongo_db.drop(target_collection);
    await mongo_db.aggregate(collection_name, {match: {}, group: {_id: "$_affiliate_not_found", total: {$sum: 1}}, out : target_collection, options: {allowDiskUse:true}});
};