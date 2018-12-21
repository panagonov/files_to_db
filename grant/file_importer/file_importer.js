let fs               = require('fs');
let parse            = require('csv-parse');
let transform        = require('stream-transform');
let progress         = require("./progress.json");
let directory_reader = require("../../_utils/directory_reader.js");

let transformers = directory_reader(`${__dirname}/transformers/`, "js");
let files_path   = `${__dirname}/files`;
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

let import_bulk = async (type, record, callback) => {
    counter++;
    let document = transformers[type].transform(record);
    let id = document._id;
    // delete document._id;

    // if (!mongo_bulk.some(({_id}) => _id === id))
        mongo_bulk.push({command_name: "upsert", _id: id, document: document});

    if (counter % bulk_size === 0)
        await save_to_db(type);

    callback();
};


let importCSVfromPath = async (csv_path, type) => {
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
        let transformer = transform(import_bulk.bind(null, type), {parallel: 1});

        parser.on('error', (err) => {

            reject(err);
        });
        parser.on('finish', ()=> {
            resolve();
        });

        input.pipe(parser).pipe(transformer).pipe(process.stdout);
    });
};

let import_files_to_db = async (db) =>
{
    mongo_db = db;

    for (let type in transformers) {
        if (transformers.hasOwnProperty(type) && !transformers[type].disable)
        {
            let dir_path = `${files_path}/${type}/`;
            let files = directory_reader(dir_path, "csv", null, null, () => "");
            let files_array = Object.keys(files);

            console.log(`Start import directory "${type}" - ${files_array.length} files.`);

            for (let i =0; i <  files_array.length; i++)
            {
                let file_name = files_array[i];
                if (progress[type] && progress[type][file_name])
                    continue;

                console.log(`Import "${file_name}.csv" - ${i}/${files_array.length}`);
                await importCSVfromPath(dir_path + file_name + ".csv", type);
                await save_to_db(type);
                progress[type] = progress[type] || {};
                progress[type][file_name] = 1;
                fs.writeFileSync(__dirname + "/progress.json", JSON.stringify(progress), "utf8");
                console.log(counter);
                counter = 0;
            }
        }
    }
};

module.exports = import_files_to_db;