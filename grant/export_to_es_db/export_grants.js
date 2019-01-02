let es_db    = require("../../_utils/elasticsearch/db.js");

let collection_name = "projects";
let version_export = 4;

let build_index = async(mongo_db) =>
{
    console.log("Build indexes...");
    await mongo_db.create_index(collection_name, {data : {version_export: 1}});
    console.log("Indexes done");
};

let run = async(mongo_db) =>
{
    console.log("Export grants");
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
            let  _id = `GRANT:${item._id}`;
            let document = {
                name: (item.name || "").toLowerCase(),
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
                ...item.patent_relations && item.patent_relations.length ? {patent_relations: item.patent_relations.map(item => `PATENT:${item}`)} : "",
                ...item.patent_relations_count ? {patent_relations_count: item.patent_relations_count} : "",
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

                ...item.award_notice_date ? {date_award_notice : item.award_notice_date.toISOString()} : "",
                ...item.budget_start ? {date_budget_start : item.budget_start.toISOString()} : "",
                ...item.budget_end ? {date_budget_end : item.budget_end.toISOString()} : "",
                ...item.date_start ? {date_start : item.date_start.toISOString()} : "",
                ...item.date_end ? {date_end : item.date_end.toISOString()} : "",
                ...item.direct_cost_amt ? {cost_direct : item.direct_cost_amt} : "",
                ...item.indirect_cost_amt ? {cost_indirect : item.indirect_cost_amt} : "",
                ...item.total_cost ? {cost_total : item.total_cost} : "",
                ...item.total_cost_sub_project ? {cost_total_sub_project : item.total_cost_sub_project} : "",
                ...item.activity ? {activity : item.activity} : "",
                ...item.adm_ic ? {adm_ic : item.adm_ic} : "",
                ...item.app_type ? {app_type : item.app_type} : "",
                ...item.arra_funded ? {arra_funded : item.arra_funded} : "",
                ...item.cfda_code ? {cfda_code : item.cfda_code} : "",
                ...item.inst_type ? {inst_type : item.inst_type} : "",
                ...item.funding_ics ? {funding_ics : item.funding_ics} : "",
                ...item.funding_mechanism ? {funding_mechanism : item.funding_mechanism} : "",
                ...item.year ? {year : item.year} : "",
                ...item.ic_name ? {ic_name : item.ic_name} : "",
                ...item.nih_cats ? {nih_cats : item.nih_cats} : "",
                ...item.phr ? {phr : item.phr} : "",
                ...item.serial_number ? {serial_number : item.serial_number} : "",
                ...item.study_section ? {study_section : item.study_section} : "",
                ...item.study_name ? {study_name : item.study_name} : "",
                ...item.sub_project_id ? {sub_project_id : item.sub_project_id} : "",
                ...item.suffix ? {suffix : item.suffix} : "",
                ...item.support_year ? {support_year : item.support_year} : "",
                ...item.pi_names &&  item.pi_names.length ? {pi_names : item.pi_names} : "",
                ...item.officer_name && item.officer_name instanceof Object ? {officer_name : item.officer_name} : "",
                ...item.affiliate ? {affiliate : item.affiliate} : "",
            };

            es_bulk.push({"model_title": "grant", "command_name": "index", "_id": _id, "document": document});
            mongo_bulk.push({"command_name": "update", "_id": item._id, "document": {version_export: version_export}})
        });

        if (es_bulk.length)
            await es_db.bulk(es_bulk);

        if (mongo_bulk.length)
            await mongo_db.bulk(collection_name, mongo_bulk);

        page++;
        console.log(`Export Grants ${page * limit}/${count}`);
    }
    while(result.length === limit);
};

module.exports = run;