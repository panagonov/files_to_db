let fs                 = require("fs");
let request            = require("request");
let unzipper           = require("unzipper");
let jsdom              = require("jsdom");
const {JSDOM}          = jsdom;
let last_archive_state = require("./last_archive_state.json");
let download_path      = "E:/files_data/grants/";
let unzip_path         = "E:/files_data/grants/";

let state          = {state: "ready"};
let cancel         = false;

let set_state = (data) => {
    utils.objEach(data, (key, value) => {
        state[key] = value;
        if (!value && value !== 0)
            delete state[key]
    });
    console.log(state.state)
};

let on_cancel = () => {
    set_state({state: "ready", finish: new Date().toISOString(), error: "canceled"});
};

let urls = {
    "projects"        : "https://exporter.nih.gov/ExPORTER_Catalog.aspx?sid=0&index=0",
    "abstracts"       : "https://exporter.nih.gov/ExPORTER_Catalog.aspx?sid=0&index=1",
    "publications"    : "https://exporter.nih.gov/ExPORTER_Catalog.aspx?sid=0&index=2",
    "patents"         : "https://exporter.nih.gov/ExPORTER_Catalog.aspx?sid=0&index=3",
    "clinical_studies": "https://exporter.nih.gov/ExPORTER_Catalog.aspx?sid=0&index=4",
    "link_tables"     : "https://exporter.nih.gov/ExPORTER_Catalog.aspx?sid=0&index=5"
};

let get_url_content = url =>
    new Promise((resolve, reject) => {
       request.get(url, function(err, res, body){
           if (err)
               return reject(err);
           resolve(body)
       })
    });

let read_file_state = (link) =>
    new Promise((resolve, reject) => {
        if(cancel) return;

        request.head(link, function(err, res, body) {
            if(err)
                return reject(err);
            resolve(res.headers)
        })
    });

let collect_links = html => {
    let {window} = new JSDOM(html);
    let $ = require("jquery")(window);

    let links = $('a[title="Click here to download CSV/TXT File format"]');
    let result = [];
    $.each(links, function(index, item){
        result.push("https://exporter.nih.gov/" + $(item).attr("href"))
    });

    return result;
};

let download_file = (download_link, download_path, size, old_size) =>
    new Promise((resolve,reject) => {
        if(cancel) return on_cancel();

        let progress = 0;
        let write_stream = fs.createWriteStream(download_path);
        let site_request = request.get(download_link).on('error', function (err) {
            console.error(err);
            reject(err)
        });
        site_request.pipe(write_stream);
        site_request.on("data", function(chunk) {
            if(cancel) {
                return site_request.end()
            }

            progress += chunk.length;
            let new_state = `Download  ${((progress / size) * 100).toFixed(2)}% - ${size}(${old_size})`;
            if (new_state !== state.state) {
                set_state({state: new_state});
            }
        })
        .on("finish", function(){
            resolve()
        })
        .on('error', function (err) {
            reject(err)
        })
    });

let unzip_file = (zip_path, target_path, size) =>
    new Promise((resolve, reject) => {
        if(cancel) return on_cancel();

        let progress = 0;

        let read_stream = fs.createReadStream(zip_path);

        read_stream.pipe(unzipper.Extract({ path: target_path }))
        .on("error", (err) => {
            reject(err)
        })
        .on("finish", () => {
            resolve()
        });


        read_stream.on('data', function(chunk) {
            if(cancel) {
                on_cancel();
                return read_stream.close()
            }
            progress += chunk.length;
            let new_state = `Unzip ${zip_path} ${((progress / size) * 100).toFixed(2)}%`;
            if (new_state !== state.state) {
                set_state({state: new_state});
            }
        })
        .on("error", (err) => {
            reject(err)
        })
        .on("finish", () => {
            resolve()
        })
    });

let download_files = async (dir_name, links) => {
    for (let i = 0; i < links.length; i++)
    {
        let link = links[i];
        let archive_state = await read_file_state(link);
        if (!last_archive_state[link] || last_archive_state[link]["content-length"] !== archive_state["content-length"]) {
            let size = archive_state["content-length"];
            let old_size = last_archive_state[link] ? last_archive_state[link]["content-length"] :0;
            let file_name = link.split("/").pop();

            if (fs.existsSync(download_path + dir_name))
                fs.mkdirSync(download_path + dir_name);

            await download_file(link, download_path + dir_name + "/" + file_name, size, old_size);
            await unzip_file(download_path + dir_name + "/" + file_name, unzip_path + dir_name + "/" + file_name, size)
        }
    }
};

let collect_file_links = async() => {
    let directories = Object.keys(urls);

    for (let i = 0; i < directories.length; i++)
    {
        let dir_name = directories[i];
        let url = urls[dir_name];
        let html = await get_url_content(url);
        let links = collect_links(html);
        await download_files(dir_name, links)
    }
};

let stop = async() => {
    cancel = true;
};

collect_file_links().then(() => process.exit(0)).catch(e => console.error(e));