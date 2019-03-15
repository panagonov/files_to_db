let fs               = require("fs");
let es_db            = require("../../_utils/es_db.js");
let progress         = require("./_cache/image_uploader_progress.json");
let upload_utils = require("../../_utils/upload_utils.js");

let product_types =  fs.readdirSync(`${__dirname}/save_transformers`);
let field_name = "image_crawler_version";
let collection_name = "product";
let crawler_version = 3;

let upload = async(product_type) => {
    let limit = 1;
    let page = 0;
    let result = [];

    let body = {
        "query" : {
            "bool" : {
                "must_not": {
                    "term" : {[field_name] : crawler_version}
                }
            }
        },
        "_source" : ["images", "supplier_relations", "distributor_relations"]
    };

    do {
        let db_data = await es_db.read_unlimited(collection_name, {body: body, size : limit});
        result = db_data.data;
        let es_bulk = [];

        for (let i = 0; i < result.length; i++)
        {
            let product = result[i];
            let images = product.images;
            let supplier = product.supplier_relations[0];
            let distributor = product.distributor_relations[0];

            let document = {[field_name] : crawler_version};

            if (images && images.length)
            {
                for (let j = 0; j < images.length; j++)
                {
                    let file_data = images[j];
                    let new_image_names = await upload_utils.upload_product_image({
                        file_data,
                        path: `image/${distributor}/${supplier}`,
                        product_id: product._id,
                        image_index: j,
                        meta: {supplier: product.supplier_relations[0], distributor: product.distributor_relations[0]}}
                    );
                    new_image_names.link_id ? file_data.link = new_image_names.link_id : null;
                    new_image_names.thumb_link_id ? file_data.thumb_link = new_image_names.thumb_link_id : null
                }
                document.images = images;
                console.log(`Uploaded ${i}/${result.length} - ${images.length} images`)
            }

            es_bulk.push({"model_title": collection_name, "command_name": "update", "_id": product._id, "document": document});

        }

        if (es_bulk.length)
            await es_db.bulk(es_bulk);

        page++;
        console.log(`${page * limit}/${db_data.count}`)
    }
    while(result.length === limit);

    progress[product_type] = 1;
    fs.writeFileSync(__dirname + "/_cache/image_uploader_progress.json", JSON.stringify(progress), "utf8");
};



let run = async () => {
    await es_db.init();

    for (let i = 0; i < product_types.length; i++)
    {
        let product_type = product_types[i];

        if (progress[product_type])
            continue;
        await upload(product_type)
    }
};

module.exports = {
    run
};

let r  = () => {
   run()
   .then(() => process.exit(0))
   .catch(e => {
       console.error(e);
       r()
   })
};

r();

process.on('uncaughtException', function (err, data)
{
    console.error("--- UNCAUGHT EXCEPTION ---", err);
    r()
});