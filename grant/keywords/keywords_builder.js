let fs       = require("fs");
let es_db    = require("../../_utils/elasticsearch/db.js");

let hash_path = `${__dirname}/_sources/hash.json`;
let hash = {};

let init_dbs = async() =>
{
    await es_db.init();
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
    console.log("Build keywords hash.");
    await init_dbs();

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
        {index: "gene", fields: ["name", "aliases", "symbol", "syn1", "syn2"]},
        {index: "clinical_trial", fields: ["_id", "name"]}
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

let get = (key) =>
{
    return hash[key.toLowerCase()];
};

let clean = () =>
{
    if(fs.existsSync(hash_path))
        fs.unlinkSync(clean)
};

module.exports = {
    build_hash,
    get,
    clean
};