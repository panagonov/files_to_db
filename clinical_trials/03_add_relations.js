let fs       = require("fs");
let _        = require("underscore");
let Mongo_db = require("../_utils/db");
let es_db    = require("../_utils/elasticsearch/db.js");
let utils    = require('../_utils/utils.js');

let mongo_db;
let hash_path = `${__dirname}/_sources/hash.json`;
let hash = {};

let init_dbs = async() =>
{
    await es_db.init();
    mongo_db = new Mongo_db();
    await mongo_db.init("clinical_trails");
    await mongo_db.create_index("converted", {data: {version: 1}})
};

let build_single_hash = async({index, fields}) =>
{
    let result = {};
    let items = await es_db.read_all(index, {body: {query: {match_all: {}}, _source: fields}, add_type: true});
    console.log(items.data.length);
    items.data.forEach(item =>
    {
        let data =  {_type: item._type, _id: item._id};
        fields.forEach(field =>{
            if(typeof item[field] === "string")
                result[item[field].toLowerCase()] = data;
            else if(item[field] instanceof Array)
                item[field].forEach(alias => result[alias.toLowerCase()] = data)
        })
    });
    return result;
};

let build_hash = async() =>
{
    if (fs.existsSync(hash_path))
    {
        hash = JSON.parse(fs.readFileSync(hash_path, "utf8"));
        return;
    }

    let db_data = [
        {index: "disease", fields: ["name", "aliases"]},
        {index: "drug_or_chemical", fields: ["name", "aliases"]},
        {index: "affiliate", fields: ["name", "aliases"]},
        {index: "pathway", fields: ["name", "aliases"]},
        {index: "process", fields: ["name", "aliases"]},
        {index: "organism", fields: ["name", "aliases"]},
        {index: "anatomy", fields: ["name", "aliases"]},
        {index: "gene", fields: ["name", "aliases", "symbol", "syn1", "syn2"]}
    ];

    for(let i = 0; i < db_data.length; i++)
    {
        console.log("hash", db_data[i]);
        let single_hash = await build_single_hash(db_data[i]);
        hash = Object.assign(hash, single_hash)
    }
    console.log(Object.keys(hash).length);
    fs.writeFileSync(hash_path, JSON.stringify(hash), "utf8")
};

let get_related_pubmeds = async result =>
{
    let pmids = result.reduce((res, item) => res.concat(item.pubmed || []), []);
    pmids = _.uniq(pmids);

    let pubmeds_hash = {};
    let step = 0;
    let limit = 800;
    do {
        let ids = pmids.slice(step * limit, step * limit + limit).filter(id => id);
        let body = {
            "query": {
                "terms": {"external_links.id": ids}
            },
            "_source": ["external_links"]
        };

        let pubmeds = await es_db.read_unlimited("pubmed", {body: body, size: ids.length});

        pubmeds.data.forEach(pubmed =>
        {
            pubmed.external_links.forEach(link =>
            {
                if (pmids.indexOf(link.id) !== -1)
                {
                    pubmeds_hash[link.id] = pubmed._id
                }
            })
        });
        step++;
    }
    while(step * limit + limit < pmids.length);

    return pubmeds_hash;
};

let get_related_authors = async(result) =>
{
    let emails = result.reduce((res, item) => {
        (item.authors || []).forEach(author => {
            if (author.email)
                res.push(author.email)
        });
        return res
    }, []);
    emails = _.uniq(emails);

    let emails_hash = {};
    let step = 0;
    let limit = 800;
    do {
        let ids = emails.slice(step * limit, step * limit + limit).filter(id => id);
        let body = {
            "query": {
                "terms": {"emails": ids}
            },
            "_source": ["emails"]
        };

        let authors = await es_db.read_unlimited("author", {body: body, size: ids.length});

        authors.data.forEach(author =>
        {
            author.emails.forEach(email =>
            {
                emails_hash[email] = author._id;
            })
        });
        step++
    }
    while(step * limit + limit < emails.length);
    return emails_hash;
};

let update_relations = async() =>
{
    let limit    = 1000;
    let version  = 1;
    let page     = 0;
    let result   = [];
    let db_index = "converted";

    let count = await mongo_db.read(db_index, {body: {version: {$ne: version}}, count_only: true});

    do {
        result = await mongo_db.read(db_index, {body: {version: {$ne: version}}, size: limit});
        let mongo_bulk = [];

        let pubmeds_hash = await get_related_pubmeds(result);
        let authors_hash = await get_related_authors(result);

        result.forEach(item => {
            let document = {version: version};

            (item.keywords || []).forEach(keyword =>
            {
                let match = hash[keyword.toLowerCase()];
                if (match)
                {
                    let type = utils.get_node_type(match);
                    document[type +"_relations"] = document[type +"_relations"] || [];
                    document[type +"_relations"].push(match._id);
                    document[type +"_relations_count"] = document[type +"_relations_count"] || 0;
                    document[type +"_relations_count"]++;
                }
                else {
                    // console.log(keyword)
                }
            });

            (item.pubmed || []).forEach(pmid =>
            {
                if (pubmeds_hash[pmid])
                {
                    document["pubmed_relations"] = document["pubmed_relations"] || [];
                    document["pubmed_relations"].push(pubmeds_hash[pmid]);
                    document["pubmed_relations_count"] = document["pubmed_relations_count"] || 0;
                    document["pubmed_relations_count"]++;
                }
            });

            (item.authors || []).forEach(author =>
            {
                (author.emails || []).forEach(email =>
                {
                    if (authors_hash[email])
                    {
                        document["author_relations"] = document["author_relations"] || [];
                        document["author_relations"].push(authors_hash[email]);
                        document["author_relations_count"] = document["author_relations_count"] || 0;
                        document["author_relations_count"]++;
                    }

                })
            });

            let facility = [].concat(item.facility || [], item.sponsor || []).filter(({name}) => name);
            facility.forEach(({name}) =>
            {
                let match = hash[name.toLowerCase()];
                if (match)
                {
                    document["affiliate_relations"] = document["affiliate_relations"] || [];
                    document["affiliate_relations"].push(match._id);
                    document["affiliate_relations_count"] = document["affiliate_relations_count"] || 0;
                    document["affiliate_relations_count"]++;
                }
            });

            mongo_bulk.push({command_name: "update", _id: item._id, document: document})
        });

        await mongo_db.bulk(db_index, mongo_bulk);

        page++;
        console.log(count + "/" + page * limit);
    }
    while(result.length === limit)
};

let start = async() =>
{
    await init_dbs();
    await build_hash();
    await update_relations()
};

start()
.then(() => process.exit())
.catch(e => console.error(e));