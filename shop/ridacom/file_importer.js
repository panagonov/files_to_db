let fs               = require('fs');
let parse            = require('csv-parse');
let transform        = require('stream-transform');
let progress         = require("./_cache/file_importer_progress.json");
let directory_reader = require("../../_utils/directory_reader.js");

let transformers;
let files_path;
let mongo_db;
let mongo_bulk   = [];
let bulk_size    = 1000;
let counter      = 0;


let save_to_db = async(collection_name) =>
{
    if (!mongo_bulk.length)
        return;
    await mongo_db.bulk(collection_name, mongo_bulk);
    console.log(counter);
    mongo_bulk = []
};

let import_bulk = async (type, collection_name, record, callback) => {
    counter++;
    let document = transformers[type].transform(record);
    if (!document)
        return callback();

    let allow_duplicated = transformers[type].allow_duplicated;
    let id = document._id;

    if (allow_duplicated)
    {
        delete document._id;
        if (!mongo_bulk.some(({_id}) => _id === id))
            mongo_bulk.push({command_name: "upsert", _id: id, document: document});
    }
    else
    {
        mongo_bulk.push({command_name: "upsert", _id: id, document: document});
    }

    if (counter % bulk_size === 0)
    {
        await save_to_db(collection_name);
    }

    callback();
};


let importCSVfromPath = async (csv_path, type, collection_name) => {
    if (!fs.existsSync(csv_path)) {
        console.log(`The file "${csv_path}" doesn't exist'`);
        process.exit(1);
    }

    return new Promise((resolve, reject) => {
        let parser = parse({
            delimiter: ',',
            columns: true,
            skip_empty_lines: true,
            auto_parse: true
        });
        let input = fs.createReadStream(csv_path);
        let transformer = transform(import_bulk.bind(null, type, collection_name), {parallel: 1});

        parser.on('error', (err) => {

            reject(err);
        });
        parser.on('finish', ()=> {
            resolve();
        });

        input.pipe(parser).pipe(transformer).pipe(process.stdout);
    });
};

let run = async (db, distributor, supplier) =>
{
    let output_collection_name = "product";

    mongo_db = db;
    transformers = directory_reader(`${__dirname}/transformers/${supplier}/`, "js");
    files_path = `${__dirname}/files/${supplier}/`;

    for (let type in transformers) {
        if (transformers.hasOwnProperty(type) && !transformers[type].disable)
        {
            let file_name = type;
            if (progress[distributor] && progress[distributor][supplier] && progress[distributor][supplier][file_name])
                continue;

            console.log(`Import "${file_name}.csv"`);
            await importCSVfromPath(files_path + file_name + ".csv", type,output_collection_name);
            await save_to_db(output_collection_name);
            progress[distributor] = progress[distributor] || {};
            progress[distributor][supplier] = progress[distributor][supplier] || {};
            progress[distributor][supplier][file_name] = 1;
            fs.writeFileSync(__dirname + "/_cache/file_importer_progress.json", JSON.stringify(progress), "utf8");
            console.log(counter);
            counter = 0;
        }
    }
};

clean = async (mongo_db)=>
{
    fs.writeFileSync(__dirname + "/_cache/file_importer_progress.json", "{}", "utf8");

    for (let key in transformers)
    {
        if (transformers.hasOwnProperty(key)) {
            await mongo_db.drop(key)
        }
    }
};

module.exports = {
    run,
    clean
};