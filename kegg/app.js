let fs = require("fs");
let directory_reader = require("../_utils/directory_reader.js");
let MongoDb = require("../_utils/db.js");

let transformers = directory_reader( `${__dirname}/transformers/`, "js");

let source_path = `${__dirname}/resources/`;
let file_lists_path = `${__dirname}/file_lists/`;
let progress_path = `${__dirname}/progress/`;
let count_path = `${__dirname}/file_count/`;
let mongo_db;

let init = async () =>
{
    mongo_db = new MongoDb();
    await mongo_db.init({database: "companies"})
};

let make_file_lists = (source_path, dest_path, count_path) =>
{
    let filesList = fs.readdirSync(source_path);

    filesList.forEach((fileName) => {

        let file = source_path + fileName;
        let dest_file_name = dest_path + fileName + ".json";
        if (fs.lstatSync(file).isDirectory() && !fs.existsSync(dest_file_name)) {
            let res = fs.readdirSync(file);
            fs.writeFileSync(dest_path + fileName + ".json", JSON.stringify(res), "utf8");
            fs.writeFileSync(count_path + fileName, res.length, "utf8");
        }
    })
};

let get_collection_names = (source_path) =>
{
    let result = [];
    let filesList = fs.readdirSync(source_path);

    filesList.forEach((fileName) => {

        let file = source_path + fileName;
        let name = fileName.split(".").shift();
        let ext = fileName.split(".").pop();
        if (!(fs.lstatSync(file).isDirectory()) && ext === "json") {
            result.push(name)
        }
    });

    return result;
};

let read_files_list = (source_path, file_name) =>
{
    return JSON.parse(fs.readFileSync(source_path + file_name + ".json", "utf8"))
};

let read_count = (source_path, file_name) =>
{
    return parseInt(fs.readFileSync(source_path + file_name, "utf8"), 10)
};

let read_progress = (source_path, file_name) =>
{
    if (fs.existsSync(source_path + file_name))
    {
        let progress = fs.readFileSync(source_path + file_name);
        return parseInt(progress)
    }

    return 0
};

let update_progress = (source_path, file_name, value) =>
{
    fs.writeFileSync(source_path + file_name, value, "utf8");
};

let read_files_content = file_name =>
{
    if (!(fs.lstatSync(file_name).isDirectory()))
        return fs.readFileSync(file_name, "utf8");

    let result = [];
    let filesList = fs.readdirSync(file_name);
    filesList.forEach((sub_file_name) => {

        let file = file_name + "/" + sub_file_name;
         if (!(fs.lstatSync(file).isDirectory())) {
            result.push(fs.readFileSync(file, "utf8"))
        }
    });

    return result
};

let should_stop_process = (name) =>
{
    if (!transformers[name] || transformers[name].disable)
        return true;

    let file_count = read_count(count_path, name);
    let progress =  read_progress(progress_path, name);

    return file_count <= progress
};

let get_files_list = (name, progress) =>
{
    let files_list = read_files_list(file_lists_path, name);
    files_list.splice(0, progress);
    return files_list;
};

let save_result = async (collection, data) =>
{
    await mongo_db.create(collection, {data: data})
};

let transform_directory_data = async (name, files_list, progress) =>
{
    for(let i = 0; i < files_list.length; i++)
    {
        let file_name = files_list[i];
        let file_contents = read_files_content(source_path + name + "/" + file_name, "utf8");

        let json_value = transformers[name].transform(file_contents);

        if (json_value)
        {
            json_value._id = file_name;
            await save_result(name, json_value);
        }

        update_progress(progress_path, name, ++progress);

        if (i % 100 === 0)
            console.log(name, i +"/" + files_list.length)
    }
};


let start = async() =>
{
    await init();

    make_file_lists(source_path, file_lists_path, count_path);
    let collections = get_collection_names(file_lists_path);

    for(let i =0; i < collections.length; i++)
    {
        let name = collections[i];

        if (should_stop_process(name))
            continue;

        let progress = read_progress(progress_path, name);

        let files_list = get_files_list(name, progress);

        await transform_directory_data(name, files_list, progress);
    }
};

start()
.then(() => process.exit(0))
.catch(e => console.error(e));
