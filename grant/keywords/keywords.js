let keywords_builder       = require("./keywords_builder.js");
let enrich_grants = {
    add_keyword_relations: require("./enrich_grants/add_keyword_relations.js"),
    add_patents          : require("./enrich_grants/add_patents.js"),
    add_clinical_trials  : require("./enrich_grants/add_clinical_trials.js"),
    add_pubmeds          : require("./enrich_grants/add_pubmeds.js"),
    add_external_links   : require("./enrich_grants/add_external_links.js")
};

let enrich_patents = {
    add_affiliate          : require("./enrich_patents/add_affiliate.js"),
    add_keyword_relations : require("./enrich_patents/add_keyword_relations.js"),
    add_external_links : require("./enrich_patents/add_external_links.js")
};

let aggs_grants = {
    affiliate_not_found          : require("./aggs_grants/affiliate_not_found.js")
    terms_not_found              : require("./aggs_grants/terms_not_found.js")
};


let run = async(mongo_db) =>
{
    await keywords_builder.build_hash();

    await enrich_grants.add_keyword_relations(mongo_db);
    await enrich_grants.add_patents(mongo_db);
    await enrich_grants.add_clinical_trials(mongo_db);
    await enrich_grants.add_pubmeds(mongo_db);
    await enrich_grants.add_external_links(mongo_db);

    await enrich_patents.add_affiliate(mongo_db);
    await enrich_patents.add_keyword_relations(mongo_db);
    await enrich_patents.add_external_links(mongo_db);

    await aggs_grants.affiliate_not_found(mongo_db);
    await aggs_grants.terms_not_found(mongo_db);
};

let clean = async() =>
{
    keywords_builder.clean();
};

module.exports = {
    run,
    clean
};