let parse     = require('csv-parse');
let transform = require('stream-transform');
let fs        = require('fs');

let result = {};

let transformer = (line) =>{
    let category_field = Object.keys(line)
    .filter(key => /L_\d{1,2}/.test(key) && line[key].trim())
    [0];

    let original_category = line[category_field]
    .replace(/"/g, "")
    .replace(/&/g, "and")
    .replace(/\(\d+\)?$/, "")
    .replace(/\W/g, "_")
    .replace(/_+/g, "_")
    .replace(/_$/, "")
    .toLowerCase();

    let mapping_value = line["M_0"];
    if (!mapping_value || !mapping_value.trim())
        return;

    mapping_value
    .split(";")
    .map(item => item.replace(/("|,|в„ў)/g, "").trim().toLowerCase())
    .filter(item => item)
    .forEach(item => {
        result[item] = original_category
    })
};

let import_CSV_from_path = async (csv_path) => {
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

        parser.on('error', (err) => {

            reject(err);
        });
        parser.on('finish', ()=> {
            resolve();
        });

        input.pipe(parser).pipe(transform(transformer, {parallel: 1})).pipe(process.stdout);
    });
};


import_CSV_from_path(__dirname + `/category_map.csv`)
.then(() => fs.writeFileSync(__dirname + `/category_map.json`, JSON.stringify(result), "utf8"))
.catch(e => console.error(e));