let fs                = require("fs");
let es_db             = require("../../_utils/elasticsearch/db.js");
let human_name_parser = require('humanparser');

let version = 1;

let mongo_collection       = "patent_justia";
let es_db_index            = "patent";
let unknown_history_fields = {};


let build_index = async(mongo_db) =>
{
    console.log("Build enrich_patent indexes...");
    await mongo_db.create_index(mongo_collection, {data : {version_enrich: 1}});
    console.log("Indexes done");
};

let history_enrich = (history) =>
{
    let clear_string = str => (str || "").replace(/(\n|\r|\t)/g, "").replace(/\s+/g, " ").trim();

    let _get_name_and_place_from_string = value => {
        let split_res = (value || "").trim().replace(")", "").split("(");

        let name = (split_res[0] || "").trim();
        let place =  (split_res[1] || "").trim().split(",");
        let city = (place[0] || "").trim();
        let state = (place[1] || "").trim();

        return {
            ...name ? {name: name} : "",
            ...city ? {city: city} : "",
            ...state ? {state: state} : "",
        }
    };

    let history_transformers = {
        "inventor" : value => {
            if (!value)
                return null;

            let split_res = value.replace(/\),\s/g, ")^").split("^");

            let result = split_res.map(item => {
                let inventor = _get_name_and_place_from_string(item);

                if(!inventor)
                    debugger;

                let {name, city, state} = inventor;
                let parse_name = human_name_parser.parseName(name);

                return {
                    ...parse_name.firstName ? {first_name: parse_name.firstName} : "",
                    ...parse_name.middleName ? {middle_name: parse_name.middleName} : "",
                    ...parse_name.lastName ? {last_name: parse_name.lastName} : "",
                    ...city ? {city: city} : "",
                    ...state ? {state: state} : ""
                }
            });
            return {"inventors": result}
        },
        "law firm" : value => {
            if (!value)
                return null;
            return {"law_firm": clear_string(value)}
        },
        "assistant examiner" :  (value) => {
            if (!value)
                return null;

            let parse_name = human_name_parser.parseName(value);
            return {
                "assistant_examiner" : {
                    ...parse_name.firstName ? {first_name: parse_name.firstName} : "",
                    ...parse_name.middleName ? {middle_name: parse_name.middleName} : "",
                    ...parse_name.lastName ? {last_name: parse_name.lastName} : "",
                }
            }
        }
    };

    let result = {};
    if (history)
    {
        for (let key in history)
        {
            if (history.hasOwnProperty(key) && history_transformers.hasOwnProperty(key))
            {
                let transform_history_res = history_transformers[key](history[key]);
                if (transform_history_res)
                    result = Object.assign(result, transform_history_res);
            }
        }
    }

    return result
};

let run = async (mongo_db) =>
{
    await build_index(mongo_db);

    let result = [];
    let limit = 500;
    let page = 0;

    let count = await mongo_db.read(mongo_collection, {body: {version_enrich :{$ne: version}}, count_only: true});

    do
    {
        let es_bulk = [];
        let res_hash = {};
        let ids = [];

        result = await mongo_db.read(mongo_collection, {body: {version_enrich :{$ne: version}}, size: limit});
        result.forEach(item => {
            let patent_id = `PATENT:${item._id}`;
            ids.push(patent_id);
            res_hash[patent_id] = item
        });

        let db_data = await es_db.read_unlimited(es_db_index, {body: {"query" : {"terms" : {"_id" : ids}}}, size: ids.length});

        db_data.data.forEach(item =>
        {
            let enrich_data = res_hash[item._id];

            for (let key in enrich_data.history)
                if (!unknown_history_fields[key])
                    unknown_history_fields[key] = enrich_data.history[key];

            let external_links = item.external_links;
            enrich_data.app_num ? external_links.push({key: "patent_app_num", id:  enrich_data.app_num }) : null;
            enrich_data.pub_num ? external_links.push({key: "patent_pub_num", id:  enrich_data.pub_num }) : null;

            external_links = external_links.reduce((res, item) => {
                if (!res.some(({key}) => key === item.key))
                    res.push(item);
                return res;
            }, []);

            let document = {
                ...enrich_data.patent_relations && enrich_data.patent_relations.length ? {patent_relations: enrich_data.patent_relations} : "",
                ...enrich_data.patent_relations_count ? {patent_relations_count: enrich_data.patent_relations_count} : "",
                ...enrich_data.date_created ? {date_created: enrich_data.date_created} : "",
                ...enrich_data.date_filed ? {date_filed: enrich_data.date_filed} : "",
                ...enrich_data.abstract ? {abstract: enrich_data.abstract} : "",
                ...enrich_data.claims && enrich_data.claims.length  ? {claims: enrich_data.claims} : "",
                ...enrich_data.primary_examiner ? {primary_examiner: enrich_data.primary_examiner} : "",
                ...enrich_data.affiliate ? {affiliate: enrich_data.affiliate} : "",
                ...enrich_data.inventors && enrich_data.inventors.length ? {inventors: enrich_data.inventors} : "",
                ...enrich_data.type ? {patent_type: enrich_data.type} : "",
                ...enrich_data.us_citation ? {us_citation: enrich_data.us_citation} : "",
                ...enrich_data["foreign-citations"] ? {foreign_citations: enrich_data["foreign-citations"]} : "",
                ...enrich_data.law_firm ? {law_firm: enrich_data.law_firm} : "",
                external_links: external_links
            };

            document = Object.assign(document, history_enrich(enrich_data.history));

            es_bulk.push({"model_title": es_db_index, "command_name": "update", "_id": item._id, "document": document});
        });

        if (es_bulk.length)
            await es_db.bulk(es_bulk);

        await mongo_db.update_many(mongo_collection, {query: {_id : {$in :result.map(item => item._id)}}, data : {version_enrich : version}});

        page++;
        console.log(`Enrich patents ${page * limit}/${count}`);
    }
    while(result.length === limit);

    fs.writeFileSync(__dirname + "/unknown.json", JSON.stringify(unknown_history_fields), "utf8")
};

module.exports = {
    run
};