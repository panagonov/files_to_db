let fs               = require("fs");
let es_db            = require("../../_utils/es_db.js");
let progress         = require("./_cache/pdf_uploader_progress.json");
let upload_pdf_utils = require("../../_utils/upload_pdf_utils.js");

let product_types =  fs.readdirSync(`${__dirname}/save_transformers`);
let field_name = "pdf_crawler_version";
let crawler_version = 3;

let upload = async(db_index) => {
    let limit = 10;
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
        "_source" : ["pdf", "supplier_relations", "distributor_relations"]
    };

    do {
        let db_data = await es_db.read_unlimited(db_index, {body: body, size : limit});
        result = db_data.data;
        let es_bulk = [];

        for (let i = 0; i < result.length; i++)
        {
            let product = result[i];
            let pdfs = product.pdf;
            let supplier = product.supplier_relations[0];
            let distributor = product.distributor_relations[0];

            let document = {[field_name] : crawler_version};

            if (pdfs && pdfs.length)
            {
                for (let j = 0; j < pdfs.length; j++)
                {
                    let file_data = pdfs[j];
                    let new_image_names = await upload_pdf_utils.upload_product_pdf({
                        file_data,
                        path: `pdf/${distributor}/${supplier}`,
                        file_name: (file_data.link || file_data.href).split("/").pop(),
                        image_index: j,
                        meta: {supplier: supplier, distributor: distributor}}
                    );
                    new_image_names.link_name ? file_data.link = new_image_names.link_name : null;
                    new_image_names.thumb_name ? file_data.thumb_link = new_image_names.thumb_name : null
                }
                document.pdf = pdfs;
                console.log(`Uploaded ${i}/${result.length} - ${pdfs.length} pdf`)
            }

            es_bulk.push({"model_title": db_index, "command_name": "update", "_id": product._id, "document": document});
        }

        if (es_bulk.length)
            await es_db.bulk(es_bulk);

        page++;
        console.log(db_index, `${page * limit}/${db_data.count}`)
    }
    while(result.length === limit);

    progress[db_index] = 1;
    fs.writeFileSync(__dirname + "/_cache/pdf_uploader_progress.json", JSON.stringify(progress), "utf8");
};



let run = async () => {

    await es_db.init();

    for (let i = 0; i < product_types.length; i++)
    {
        let db_index = product_types[i];

        if (progress[db_index])
            continue;
        await upload(db_index)
    }
};

module.exports = {
    run
};

// let r  = () => {
//    run()
//    .then(() => process.exit(0))
//    .catch(e => {
//        console.error(e);
//        r()
//    })
// };
//
// r();
//
// process.on('uncaughtException', function (err, data)
// {
//     console.error("--- UNCAUGHT EXCEPTION ---", err);
//     r()
// });