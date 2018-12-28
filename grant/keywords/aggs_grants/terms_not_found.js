let collection_name = "projects";
let target_collection = "_terms_not_found";

let build_index = async(mongo_db) =>
{
    console.log("Build indexes...");
    await mongo_db.create_index(collection_name, {data : {_terms_not_found: 1}});
    console.log("Indexes done");
};

let run = async(mongo_db) =>
{
    console.log("Create terms not found aggs");
    await build_index();
    await mongo_db.drop(target_collection);
    await mongo_db.aggregate(collection_name, {match: {}, group: {_id: "$_terms_not_found", total: {$sum: 1}}, out : target_collection, options: {allowDiskUse:true}});
};