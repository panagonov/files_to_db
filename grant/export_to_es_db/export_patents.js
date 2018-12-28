let es_db    = require("../../_utils/elasticsearch/db.js");

let collection_name = "patents";
let version_export = 1;

let build_index = async(mongo_db) =>
{
    console.log("Build indexes...");
    await mongo_db.create_index(collection_name, {data : {version_export: 1}});
    console.log("Indexes done");
};

let run = async(mongo_db) =>
{
    console.log("Export patents");
    await build_index(mongo_db);

    let result = [];
    let limit = 1000;
    let page = 0;

    let count = await mongo_db.read(collection_name, {body: {version_export: {$ne : version_export}}, count_only: true});

    do {
        let es_bulk = [];
        let mongo_bulk = [];
        result = await mongo_db.read(collection_name, {body: {version_export: {$ne : version_export}}, size: limit});

        result.forEach(item =>
        {
            let  _id = `PATENT:${item._id}`;
            let document = {
                name: item.name,
                external_links: item.external_links,
                ...item.affiliate_relations && item.affiliate_relations.length ? {affiliate_relations: item.affiliate_relations} : "",
                ...item.affiliate_relations_count ? {affiliate_relations_count: item.affiliate_relations_count} : "",
                ...item.anatomy_relations && item.anatomy_relations.length ? {anatomy_relations: item.anatomy_relations} : "",
                ...item.anatomy_relations_count ? {anatomy_relations_count: item.anatomy_relations_count} : "",
                ...item.disease_relations && item.disease_relations.length ? {disease_relations: item.disease_relations} : "",
                ...item.disease_relations_count ? {disease_relations_count: item.disease_relations_count} : "",
                ...item.drug_relations && item.drug_relations.length ? {drug_relations: item.drug_relations} : "",
                ...item.drug_relations_count ? {drug_relations_count: item.drug_relations_count} : "",
                ...item.gene_relations && item.gene_relations.length ? {gene_relations: item.gene_relations} : "",
                ...item.gene_relations_count ? {gene_relations_count: item.gene_relations_count} : "",
                ...item.grant_relations && item.grant_relations.length ? {grant_relations: item.grant_relations.map(item => `GRANT:${item}`)} : "",
                ...item.grant_relations_count ? {grant_relations_count: item.grant_relations_count} : "",
                ...item.organism_relations && item.organism_relations.length ? {organism_relations: item.organism_relations} : "",
                ...item.organism_relations_count ? {organism_relations_count: item.organism_relations_count} : "",
                ...item.process_relations && item.process_relations.length ? {process_relations: item.process_relations} : "",
                ...item.process_relations_count ? {process_relations_count: item.process_relations_count} : "",
                ...item.pubmed_relations && item.pubmed_relations.length ? {pubmed_relations: item.pubmed_relations} : "",
                ...item.pubmed_relations_count ? {pubmed_relations_count: item.pubmed_relations_count} : "",
                ...item.pathway_relations && item.pathway_relations.length ? {pathway_relations: item.pathway_relations} : "",
                ...item.pathway_relations_count ? {pathway_relations_count: item.pathway_relations_count} : "",
                ...item.clinical_trial_relations && item.clinical_trial_relations.length ? {clinical_trial_relations: item.clinical_trial_relations} : "",
                ...item.clinical_trial_relations_count ? {clinical_trial_relations_count: item.clinical_trial_relations_count} : "",
            };

            es_bulk.push({"model_title": "patent", "command_name": "index", "_id": _id, "document": document});
            mongo_bulk.push({"command_name": "update", "_id": item._id, "document": {version_export: version_export}})
        });

        if (es_bulk.length)
            await es_db.bulk(es_bulk);

        if (mongo_bulk.length)
            await mongo_db.bulk(collection_name, mongo_bulk);

        page++;
        console.log(`Export Patents ${page * limit}/${count}`);
    }
    while(result.length === limit);
};

module.exports = run;