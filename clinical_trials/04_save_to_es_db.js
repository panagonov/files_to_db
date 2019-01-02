let Mongo_db = require("../_utils/db.js");
let es_db    = require("../_utils/elasticsearch/db.js");

let mongo_db;

let init_dbs = async() =>
{
    await es_db.init();
    mongo_db = new Mongo_db();
    await mongo_db.init("clinical_trails");
};

let save_data = async() =>
{
    let limit    = 1000;
    let version  = 1;
    let page     = 0;
    let result   = [];
    let db_index = "converted";

    let count = await mongo_db.read(db_index, {body: {version: {$ne: version}}, count_only: true});

    do {
        result = await mongo_db.read(db_index, {body: {version: {$ne: version}}, size: limit});

        let es_bulk = result.map(item =>
        {
            let document = {
                name : item.name,
                description: item.description,
                external_links: item.external_links,
                ...item.why_stopped ? {why_stopped : item.why_stopped} : "",
                ...item.status ? {status : item.status} : "",
                ...item.study_type ? {study_type : item.study_type} : "",
                ...item.condition ? {condition : item.condition} : "",
                ...item.phase ? {phase : item.phase} : "",
                ...item.eligibility ? {eligibility : item.eligibility} : "",
                ...item.date_created ? {date_created : item.date_created} : "",
                ...item.date_first_submitted ? {date_first_submitted : item.date_first_submitted} : "",
                ...item.date_verified ? {date_verified : item.date_verified} : "",
                ...item.date_last_update ? {date_last_update : item.date_last_update} : "",
                ...item.date_last_update_posted ? {date_last_update_posted : item.date_last_update_posted} : "",
                ...item.gene_relations ? {gene_relations : item.gene_relations} : "",
                ...item.pathway_relations ? {pathway_relations : item.pathway_relations} : "",
                ...item.drug_relations ? {drug_relations : item.drug_relations} : "",
                ...item.disease_relations ? {disease_relations : item.disease_relations} : "",
                ...item.author_relations ? {author_relations : item.author_relations} : "",
                ...item.anatomy_relations ? {anatomy_relations : item.anatomy_relations} : "",
                ...item.process_relations ? {process_relations : item.process_relations} : "",
                ...item.organism_relations ? {organism_relations : item.organism_relations} : "",
                ...item.affiliate_relations ? {affiliate_relations : item.affiliate_relations} : "",
                ...item.pubmed_relations ? {pubmed_relations : item.pubmed_relations} : "",

                ...item.gene_relations_count ? {gene_relations_count : item.gene_relations_count} : "",
                ...item.pathway_relations_count ? {pathway_relations_count : item.pathway_relations_count} : "",
                ...item.drug_relations_count ? {drug_relations_count : item.drug_relations_count} : "",
                ...item.disease_relations_count ? {disease_relations_count : item.disease_relations_count} : "",
                ...item.author_relations_count ? {author_relations_count : item.author_relations_count} : "",
                ...item.organism_relations_count ? {organism_relations_count : item.organism_relations_count} : "",
                ...item.process_relations_count ? {process_relations_count : item.process_relations_count} : "",
                ...item.anatomy_relations_count ? {anatomy_relations_count : item.anatomy_relations_count} : "",
                ...item.pubmed_relations_count ? {pubmed_relations_count : item.pubmed_relations_count} : "",
                ...item.affiliate_relations_count ? {affiliate_relations_count : item.affiliate_relations_count} : "",
            };

           return {"model_title": "clinical_trial", "command_name": "update",  _id: item._id, "document": document};
        });

        // for(let i = 0; i < es_bulk.length; i++)
        // {
        //     let item = es_bulk[i].document;
        //     item._id =  es_bulk[i]._id;
        //     await es_db.create("clinical_trial", {data: item});
        //     debugger
        // }

        if (es_bulk.length)
            await es_db.bulk(es_bulk);

        await mongo_db.update_many(db_index, {
            query: {_id: {$in :result.map(({_id}) => _id) }},
            data: {version: version}}
        );

        page++;
        console.log(count + "/" + page * limit);
    }
    while(result.length === limit)
};

let start = async() =>
{
    await init_dbs();
    await save_data();
};

start()
.then(() => process.exit())
.catch(e => console.error(e));