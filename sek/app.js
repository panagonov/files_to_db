/*************************************************************
 *
 * https://www.sec.gov/Archives/<file_field_value>
 *
 *************************************************************/

let fs = require("fs");
let MongoDb = require("../_utils/db.js");

let mongo_db;

let file_names = [];

let db_name                   = "sec";
let main_collection           = "step_1";
let companies_aggs_collection = "companies_aggs";
let forms_aggs_collection     = "forms_aggs";
let result_collection         = "companies";

let init = async () =>
{
    mongo_db = new MongoDb();
    await mongo_db.init({database: db_name})
};

let clear_first_unused_rows = (data_array) =>
{
    for (let i =0; i < data_array.length; i++)
    {
        let row = data_array[i];
        if (/^\-+$/.test(row))
        {
            data_array = data_array.slice(i + 1, data_array.length);
            break
        }
    }
    data_array.pop();
    return data_array
};

let split_by_columns = (data_array) =>
{
    return data_array.map(row =>
    {
        let name = row.slice(0,62).trim();
        let form = row.slice(62,74).trim();
        let cik = row.slice(74,86).trim();
        let date = row.slice(86,98).trim();
        let file = row.slice(98,row.length).trim();

        date = new Date(date);
        let year = date.getFullYear();
        let q = Math.floor(date.getMonth() / 4) + 1;

        return {name, cik, form, date, year, q, file}
    });
};


let generate_db_data_from_files = async() =>
{
    for (let i = 0; i < file_names.length; i ++)
    {
        console.log(file_names[i]);
        let file_data = fs.readFileSync(`./files/${file_names[i]}.idx`, "utf8");
        let data_array = file_data.split("\n");
        data_array = clear_first_unused_rows(data_array);
        data_array = split_by_columns(data_array);

        await mongo_db.create_many(main_collection, {data: data_array})
    }
};

let generate_company_collection = async() =>
{
    try {
        await mongo_db.create_index(main_collection, { data: {cik: 1}});
    }
    catch(e) {}
    await mongo_db.aggregate(main_collection, {match: {}, group: {_id: "$cik", total: {$sum: 1}}, out: companies_aggs_collection, options: {allowDiskUse : true}});
};

let generate_form_collection = async() =>
{
    try {
        await mongo_db.create_index(main_collection, { data: {form: 1}})
    }
    catch(e) {}
    await mongo_db.aggregate(main_collection, {match: {}, group: {_id: "$form", total: {$sum: 1}}, out: forms_aggs_collection, options: {allowDiskUse : true}});
};

let get_forms_from_each_company = async() =>
{
    let limit = 100;
    let page = 0;
    let result = [];
    let count = await mongo_db.read(companies_aggs_collection, {body: {}, count_only: true});

    do
    {
        let mongo_bulk = [];
        result = await mongo_db.read(companies_aggs_collection, {body: {}, size: limit, page: page});
        let cik_ids = result.map(({_id}) => _id);
        let companies_data = await mongo_db.read(main_collection, {body: {cik: {$in: cik_ids}}});

        let companies_hash = companies_data.reduce((res, item) =>
        {
            res[item.cik] = res[item.cik] || [];
            res[item.cik].push(item);
            return res;
        }, {});

        result.forEach(({_id}) =>
        {
            let company_data = companies_hash[_id];
            let main_data = company_data[0];
            let id = `SEC:C:[${main_data.cik}]`;

            let forms = company_data.map(data =>( {type: data.form, date: data.date, file: data.file, year: data.year, q: data.q} ));

            let document = {
                name: main_data.name,
                cik: main_data.cik,
                forms: forms
            };

            mongo_bulk.push({command_name: "upsert", _id: id, document: document})
        });

        await mongo_db.bulk(result_collection, mongo_bulk);
        page++;
        console.log((page * limit) + "/" + count)
    }
    while(result.length === limit);

    await mongo_db.create_index(result_collection, { data: {"forms.type": 1}});
    await mongo_db.create_index(result_collection, { data: {"version": 1}});
    await mongo_db.create_index(result_collection, { data: {"cik": 1}});
};

let enrich_company_data = async() =>
{
    let craw_mongo = new MongoDb();
    await craw_mongo.init({host: "172.16.1.11", database: "crawlers"});
    let version = 1;
    let result = [];
    let craw_collection_name = "company_sec";
    let limit = 500;
    let page = 0;


    await craw_mongo.create_index(craw_collection_name, { data: {"version": 1}});
    let count = await craw_mongo.read(craw_collection_name, {body: {version: {$ne: version}}, count_only: true});

    do {
        result = await craw_mongo.read(craw_collection_name, {body: {version: {$ne: version}}, size: limit});
        let cik_hash = result.reduce((res, item) =>
        {
            if (res[item.cik] )
            {
                console.error("duplicate cik", item.cik);
            }
            res[item.cik] = item;
            return res;
        },{});

        let ciks = result.map(({cik}) => cik);
        let originals = await mongo_db.read(result_collection,{body: {cik: {$in: ciks}}});

        let mongo_bulk = [];
        originals.forEach(company =>
        {
            let enrich_data = cik_hash[company.cik];

            let document = {
                ...enrich_data.address ? {address: enrich_data.address} : "",
                ...enrich_data.trading_symbol ? {trading_symbol: enrich_data.trading_symbol} : "",
                ...enrich_data.owner_cik ? {owner_cik: enrich_data.owner_cik} : "",
                ...enrich_data.owner_name ? {owner_name: enrich_data.owner_name} : "",
                ...enrich_data.owner_first_name ? {owner_first_name: enrich_data.owner_first_name} : "",
                ...enrich_data.owner_middle_name ? {owner_middle_name: enrich_data.owner_middle_name} : "",
                ...enrich_data.owner_last_name ? {owner_last_name: enrich_data.owner_last_name} : "",
                ...enrich_data.classification ? {classification: enrich_data.classification} : "",
                ...enrich_data.irs_number ? {irs_number: enrich_data.irs_number} : "",
            };

            mongo_bulk.push({command_name: "update", _id: company._id, document: document})
        });

        await mongo_db.bulk(result_collection, mongo_bulk);
        await craw_mongo.update_many(craw_collection_name, {query: {_id: {$in: result.map(({_id}) => _id)}}, data:{version: version}});

        page++;
        console.log((page * limit) + "/" + count)

    }while(result.length === limit)
};

let run = async() =>{
    await init();
    // await generate_db_data_from_files();
    // await generate_company_collection();
    // await generate_form_collection();
    // await get_forms_from_each_company();
    await enrich_company_data();

};

run()
.then(() => process.exit(0))
.catch(e => console.error(e));