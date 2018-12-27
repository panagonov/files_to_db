let keywords_builder       = require("./keywords_builder.js");
let enrich_grants = {
    add_keywords_relations : require("./enrich_grants/add_keywords_relations.js"),
    add_patents            : require("./enrich_grants/add_patents.js"),
    add_clinical_trials    : require("./enrich_grants/add_clinical_trials.js"),
    add_pubmeds            : require("./enrich_grants/add_pubmeds.js")
};

let enrich_patents = {
    add_affiliate          : require("./enrich_patents/add_affiliate.js")
};

let target_collection = "projects";
let version = 1;

let run = async(mongo_db) =>
{
    await keywords_builder.build_hash();
    await enrich_grants.add_keywords_relations(version, target_collection, mongo_db);
    await enrich_grants.add_patents(version, target_collection, mongo_db);
    await enrich_grants.add_clinical_trials(version, target_collection, mongo_db);
    await enrich_grants.add_pubmeds(version, target_collection, mongo_db);

    version++;
    // await enrich_patents.add_pubmeds(version, mongo_db);
};

let clean = async() =>
{
    keywords_builder.clean();
};

module.exports = {
    run,
    clean
};