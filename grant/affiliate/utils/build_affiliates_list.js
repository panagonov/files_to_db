let fs    = require("fs");
let es_db = require("../../../_utils/elasticsearch/db.js");

let path = `${__dirname}/../resources/affiliates_list.json`;

let init = async () => {
    await es_db.init();
};

let run = async () => {

    if (fs.existsSync(path))
        return JSON.parse(fs.readFileSync(path, "utf8"));

    let aff_list = [];
    let result = [];
    let limit = 10000;
    let _scroll_id = "";

    do {
        let data_from_db = await es_db.read_unlimited("affiliate", {body: {query: {match_all: {}}, "_source" : [
            "_id",
            "name",
            "domains",
            "country",
            "city",
            "type",
            "aliases"
        ]}, size: limit, _scroll_id: _scroll_id});

        result = data_from_db.data;
        _scroll_id = data_from_db._scroll_id;
        aff_list = aff_list.concat(result)

    } while(result.length === limit);

    fs.writeFileSync(path, JSON.stringify(aff_list), "utf8");
    return result;
};

let clean = () =>{
    if (fs.existsSync(path))
        return fs.unlinkSync(path);
};

module.exports = {
    init,
    run,
    clean
};