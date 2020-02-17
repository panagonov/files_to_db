let fs    = require("fs");
let es_db = require("@bioseek/core/db/elasticsearch/es_db.js");

let body = {
    "query" : {},
    "_source": ["oid", "name", "human_readable_id", "price_model.variation", "category"]
};

let agg_domain_names = async () => {
    let body = {
        "query" : {
            "match_all" : {}
        },
        "aggs" : {
            "supplier": {
                "terms" : {
                    "field" : "supplier",
                    "size" : 100
                }
            }
        }
    };

    let db_data = await es_db.read_unlimited("product", {body : body, size: 1});

    return db_data.aggregations.supplier.buckets.map(item => item.key)
};

let run = async (download_dir) =>
{
    let hash_path = `${download_dir}/id_hash.json`;

    if (fs.existsSync(hash_path))
        return JSON.parse(fs.readFileSync(hash_path, "utf8"));

    await es_db.init();

    let suppliers = await agg_domain_names();
    let id_hash = {};

    for (let i = 0; i < suppliers.length; i++)
    {
        let supplier = suppliers[i];
        id_hash[supplier] = {};
        let limit = 900;
        let page = 0;
        let result = [];
        let _scroll_id = null;

        do
        {
            body.query = {"term" : {"supplier" : supplier}};
            let db_data = await es_db.read_unlimited("product", {body : body, size: limit, _scroll_id: _scroll_id});

            _scroll_id = db_data._scroll_id;
            result = db_data.data;

            result.forEach(item => {
                let key = item.oid.toLowerCase();
                let product_data = {_id: item._id, entity_id: item.human_readable_id, term: item.name, term_type: item.category[0]};

                id_hash[supplier][key] = id_hash[supplier][key] || [];
                id_hash[supplier][key].push(product_data);

                if (item.price_model && item.price_model.variation)
                {
                    item.price_model.variation.forEach(price_item =>{
                        if (price_item.product_id)
                        {
                            let key = price_item.product_id.toLowerCase();
                            id_hash[supplier][key] = id_hash[supplier][key] || [];
                            id_hash[supplier][key].push(product_data)
                        }
                    })
                }
            });

            page++;
            console.log(supplier, " - ready", page * limit, "/", db_data.count)
        }
        while (result.length === limit);
    }


    fs.writeFileSync(hash_path, JSON.stringify(id_hash), "utf8");

    return id_hash
};

module.exports = {
    run
};

// run()
// .then(() => process.exit(0))
// .catch(e => console.error(e));