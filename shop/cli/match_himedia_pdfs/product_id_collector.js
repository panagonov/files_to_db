let fs    = require("fs");
let es_db = require("../../../_utils/es_db.js");
let hash_path = `${__dirname}/id_hash.json`;

let body = {
    "query" : {
        "match_all" : {}
        // "term" :{"supplier" : "himedia_laboratories"}
    },
    "_source": ["oid", "human_readable_id", "price_model.variation", "all_categories"]
};

let run = async () => {

    if (fs.existsSync(hash_path))
        return JSON.parse(fs.readFileSync(hash_path, "utf8"));

    await es_db.init();

    let limit = 900;
    let page = 0;
    let result = [];
    let _scroll_id = null;
    let id_hash = {};

    do
    {
        let db_data = await es_db.read_unlimited("product", {body : body, size: limit, _scroll_id: _scroll_id});
        _scroll_id = db_data._scroll_id;
        result = db_data.data;

        result.forEach(item => {
            id_hash[item.oid] = {_id: item._id, human_readable_id: item.human_readable_id, all_categories: item.all_categories};


            if (item.price_model && item.price_model.variation)
            {
                item.price_model.variation.forEach(price_item =>{
                    if (price_item.product_id)
                    {
                        id_hash[price_item.product_id] = {_id: item._id, human_readable_id: item.human_readable_id, all_categories: item.all_categories}
                    }
                })
            }
        });

        page++;
        console.log("Ready", page * limit, "/", db_data.count)
    }
    while (result.length === limit);

    fs.writeFileSync(`${__dirname}/id_hash.json`, JSON.stringify(id_hash), "utf8");

    return id_hash
};

module.exports = {
    run
};
//
// run()
// .then(() => process.exit(0))
// .catch(e => console.error(e));