let fs               = require('fs');
let progress         = require("./file_importer_progress.json");
let directory_reader = require("../../_utils/directory_reader.js");

let transformers = directory_reader(`${__dirname}/transformers/`, "js");
let files_path   = `${__dirname}/files`;
let mongo_db;
let mongo_bulk   = [];
let bulk_size    =  1000;
let counter      = 0;

let XmlStream       = require('xml-stream');

let save_to_db = async(collection_name) =>
{
    if (!mongo_bulk.length)
        return;
    try
    {
        await mongo_db.bulk(collection_name, mongo_bulk);

    }
    catch(e) {
        debugger
    }
    console.log(counter);
    mongo_bulk = []
};

let import_bulk = async(dir_path, file_name, type) =>
    new Promise((resolve, reject) => {
        let input = fs.createReadStream(dir_path + file_name + ".xml");
        let xml = new XmlStream(input);

        xml.collect("accession");
        xml.collect("gene");
        xml.collect("name");
        xml.collect("alternativeName");

        xml.on("endElement: entry", async record =>{
            let document = transformers[type].transform(record);

            mongo_bulk.push({command_name: "upsert", _id: document._id, document: document});
            counter++;
            if (counter % bulk_size === 0)
            {
                xml.pause();
                await save_to_db(type);
                xml.resume();
            }
        });

        xml.on('end', async () => {
            await save_to_db(type);
            progress[type] = progress[type] || {};
            progress[type][file_name] = 1;
            fs.writeFileSync(__dirname + "/file_importer_progress.json", JSON.stringify(progress), "utf8");
            console.log(counter);
            counter = 0;
            resolve()
        });
    });

let build_index = async(mongo_db, collection_name) =>
{
    console.log("Build indexes...");
    await mongo_db.create_index(collection_name, {data : {ids: 1}});
    console.log("Indexes done");
};

let run = async (db) =>
{
    mongo_db = db;

    for (let type in transformers) {
        if (transformers.hasOwnProperty(type) && !transformers[type].disable)
        {
            let dir_path = `${files_path}/${type}/`;
            let files = directory_reader(dir_path, "xml", null, null, () => "");
            let files_array = Object.keys(files);

            console.log(`Start import directory "${type}" - ${files_array.length} files.`);

            await build_index(mongo_db, type);

            for (let i =0; i <  files_array.length; i++)
            {
                let file_name = files_array[i];
                if (progress[type] && progress[type][file_name])
                    continue;

                console.log(`Import "${file_name}.xml" - ${i}/${files_array.length}`);
                await import_bulk(dir_path, file_name, type)
            }
        }
    }
};

clean = async (db)=>
{
    mongo_db = db;

    fs.writeFileSync(__dirname + "/file_importer_progress.json", "{}", "utf8");

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