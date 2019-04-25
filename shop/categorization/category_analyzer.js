let fs = require("fs");
let utils = require("../../_utils/utils.js");
let MongoDb = require("../../_utils/db.js");

let crawler_db;
let db_name  = "crawlers";

let init = async () =>
{
    crawler_db = new MongoDb();
    await crawler_db.init({host: "172.16.1.11", database: db_name, user: "hashstyle", "pass": "Ha5h5tylE"});
};

let run = async() =>
{
    await init();
    let result = {};

    let categories = await crawler_db.read("product", {body: {"src" : "biocompare"}});

    categories.forEach(item => {
        if (!item.category_path || !item.category_path.length)
            return;

        let value = {};
        (item.sub_categories || []).forEach(sub_cat => {
            value[sub_cat.text] = {};
            (sub_cat.sub_cats || []).forEach(sub_sub_cat => {
                value[sub_cat.text][sub_sub_cat.text] = {}
            })
        });

        utils.setKeyInJSON(result, item.category_path.join("."), value)
    });

    fs.writeFileSync(`${__dirname}/result.json`, JSON.stringify(result), "utf8")
};

run()
.then(() => process.exit(1))
.catch(e => console.error(e));