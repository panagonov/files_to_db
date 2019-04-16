let es_db        = require("../../_utils/es_db.js");
let enums        = require("../../../bioseek/discovery/core/utilities/enums.js");

let collection_name = "shop_suggest";

let run = async() =>
{
    await es_db.init();
    let limit= 900;
    let page = 0;
    let result = [];
    let scroll_id = "";

    do {
        let db_data = await es_db.read_unlimited(collection_name, {body: {query: {"term" : {"show_on_match.key" : "image"}}}, size: limit, _scroll_id : scroll_id});

        result = db_data.data;
        scroll_id = db_data._scroll_id;

        let product_oids = result.map(suggest =>  suggest.synonyms[0]);
        let products = await es_db.read_unlimited("product", {body: {query: {"terms" : {"oid" : product_oids}}, "_source": ["oid", "images", "supplier", "distributor"]}, size: product_oids.length});

        let img_hash = {};
        products.data.forEach(product => {
            let link = "";
            if (!product.images || !product.images.length)
                return;

            for(let i =0 ; i < product.images.length; i++)
            {
                if (product.images[i].thumb_link && product.images[i].thumb_link.indexOf("http") !== 0)
                    link = product.images[i].thumb_link;
                break;
            }
            if (!link)
                link = product.images[0].thumb_link || product.images[0].link;

            return product.images && product.images.length ? img_hash[product.oid] = {
                link       : link,
                distributor: product.distributor[0],
                supplier   : product.supplier[0]

            } : null
        });

        let es_bulk = [];

        result.forEach(suggest =>  {
            let oid = suggest.synonyms[0];
            if (!img_hash[oid])
            {
                suggest.show_on_match = suggest.show_on_match.filter(item => item.key !== "image")
            }
            else
            {
                let new_image = img_hash[oid];

                if (new_image.link.indexOf("http") === 0){
                    console.error(oid)
                }

                suggest.show_on_match = suggest.show_on_match.map(item => {
                    if (item.key === "image"){
                        item.value = new_image.link.indexOf("http") === 0 ? new_image.link : `${enums.server.shop}image/${new_image.distributor}/${new_image.supplier}/${encodeURIComponent(new_image.link)}`;
                    }
                    return item
                });
            }

            es_bulk.push({"model_title": collection_name, "command_name": "update", "_id": suggest._id, "document": {show_on_match: suggest.show_on_match}});
        });

        if (es_bulk.length)
            await es_db.bulk(es_bulk);

        page++;
        console.log(`Suggest fixer ${page * limit}/${db_data.count}`)
    }
    while (result.length === limit)
};

module.exports = {
    run
};

run()
.then(() => process.exit(0))
.catch(e => console.error(e));