let fs               = require("fs");
let es_db            = require("../../_utils/es_db.js");
let progress         = require("./_cache/image_uploader_progress.json");
let upload_utils = require("../../_utils/upload_utils.js");

let product_types =  fs.readdirSync(`${__dirname}/save_transformers`);
let image_crawler_version = 1;

let upload_images = async(db_index) => {
    let limit = 10;
    let page = 0;
    let result = [];

    let body = {
        "query" : {
            "bool" : {
                "must_not": {
                    "term" : {"image_crawler_version" : image_crawler_version}
                }
            }
        },
        "_source" : ["images", "supplier_relations", "distributor_relations"]
    };

    do {
        let db_data = await es_db.read_unlimited(db_index, {body: body, size : limit});
        result = db_data.data;
        let es_bulk = [];

        for (let i = 0; i < result.length; i++)
        {
            let product = result[i];
            let images = product.images;
            if (!images || !images.length)
                continue;

            for (let j = 0; j < images.length; j++)
            {
                let image_data = images[j];
                let new_image_names = await upload_utils.upload_product_image({
                    image_data,
                    path: db_index,
                    product_id: product._id,
                    image_index: j,
                    meta: {supplier: product.supplier_relations[0], distributor: product.distributor_relations[0]}}
                );
                new_image_names.link_id ? image_data.link = new_image_names.link_id : null;
                new_image_names.thumb_link_id ? image_data.thumb_link = new_image_names.thumb_link_id : null
            }

            es_bulk.push({"model_title": db_index, "command_name": "update", "_id": product._id, "document": {images: images, "image_crawler_version" : image_crawler_version}});

            console.log(`Uploaded ${i}/${result.length} - ${images.length} images`)
        }

        if (es_bulk.length)
            await es_db.bulk(es_bulk);

        page++;
        console.log(`${page * limit}/${db_data.count}`)
    }
    while(result.length === limit);

    progress[db_index] = 1;
    fs.writeFileSync(__dirname + "/_cache/image_uploader_progress.json", JSON.stringify(progress), "utf8");
};



let run = async () => {

    for (let i = 0; i < product_types.length; i++)
    {
        let db_index = product_types[i];

        if (progress[db_index])
            continue;
        await upload_images(db_index)
    }
};

module.exports = {
    run
};