let import_utils = require("../../../../_utils/save_utils.js");

let get_images = record =>
{
    let result = null;
    let crawler_item = record.crawler_item;

    if(crawler_item.image && crawler_item.image.length)
    {
        result = crawler_item.image.map((img_data, index) =>{
            let img_text = crawler_item.img_text instanceof Array ? crawler_item.img_text[index] || ""  : index === 0 ? crawler_item.img_text || "" : "";
            return {
                link: img_data.link.replace("../../", "/"),
                ...img_data.thumb ? {thumb_link: img_data.thumb.replace("../../", "/")} : "",
                ...img_text       ? {text: [img_text.replace(/\s+/g, " ").trim()]} : ""
            }
        })
    }

    return result
};

let get_pdf = record =>
{
    let result = null;
    let crawler_item = record.crawler_item;

    if(crawler_item.pdf && crawler_item.pdf.length)
    {
        result = crawler_item.pdf.map(item => {
            item.link = item.link.replace("../../", "/");
            return item;
        })
    }

    return result;
};

let get_price_model = record =>
{
    let result = {
        ...record.price && record.price.length ? {"is_multiple" : true} : "",
        "variation" :[]
    };

    let search_price = 0;
    if (record.price) {
        search_price = record.price[0].price;
    }

    search_price ? result.search_price = search_price : null;

    (record.price || []).forEach(price_item =>
    {
        let product_id =  `${record.oid}-`;
        let end_of_id = /^[\d|\.]+/.exec(price_item.size)[0];
        if (end_of_id === "0.1")
            end_of_id = "100";

        let size = import_utils.size_parser(price_item.size);

        result.variation.push({
            "price" : {
                "value"   : price_item.price || 0,
                "currency": "usd"
            },
            "product_id" : product_id + end_of_id,
            "size"       : size
        })
    });

    return result;
};

// let get_bio_object = record => [{
//     "type": "protein",
//     ...record.name ? {"name": record.name} : "",
// }];

let get_bio_object = record =>
{
    if (!record.bio_object_data || !record.bio_object_data.length)
        return null;

    return record.bio_object_data.map(bio_object => ({
        "type": "protein",
        ...bio_object.name                  ? {"name": bio_object.name}                                                 : "",
        ...bio_object.symbol                ? {"symbol": bio_object.symbol}                                             : "",
        ...bio_object.aliases               ? {"aliases": (bio_object.aliases || []).concat(bio_object.ids || [])}      : "",
        ...bio_object.gene                  ? {"gene": bio_object.gene}                                                 : "",
        ...bio_object.organism              ? {"organism": bio_object.organism}                                         : "",
        ...bio_object.ncbi_organism_tax_id  ? {"ncbi_organism_tax_id": bio_object.ncbi_organism_tax_id}                 : "",
    }));
};

module.exports = {
    get_images,
    get_pdf,
    get_price_model,
    get_bio_object
};