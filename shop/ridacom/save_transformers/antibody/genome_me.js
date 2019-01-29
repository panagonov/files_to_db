let utils        = require("../../../../_utils/utils.js");
let import_utils = require("../_utils.js");

let relation_fields = ["host", "clonality", "supplier", "distributor"];

let _getImages = item => {
    if(item.image && item.image.length)
    {
        return item.image.map((img_data, index) =>{
            let img_text = item.img_text instanceof Array ? item.img_text[index] || ""  : index === 0 ? item.img_text || "" : "";
            return {
                link: img_data.link.replace("../../", "/"),
                ...img_data.thumb ? {thumb_link: img_data.thumb.replace("../../", "/")} : "",
                ...img_text       ? {text: img_text} : ""
            }
        })
    }

    return null
};

let _getPdf = item =>
{
    if(item.pdf)
    {
        return item.pdf.map(item => {
            item.link = item.link.replace("../../", "/");
            return item;
        })
    }

    return result;
};

let _getPriceModel = (item, crawler_item) =>
{
    let result = {
        ...item.price && item.price.length ? {"is_multiple" : true} : "",
        "variation" :[]
    };

    let search_price = 0;
    if (item.price) {
        search_price = item.price[0].price;
    }

    search_price ? result.search_price = search_price : null;

    (item.price || []).forEach((price_item, index )=>
    {
        let product_id =  `${item.oid}-`;
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

let mapping_step1 = {
    "name"               : "name",
    "oid"                : "oid",
    "human_readable_id"  : record => import_utils.human_readable_id(record.name) + "_" + record.oid,
    "external_links"     : record => [{"key": "genomeme", "id": record.oid}],
    "bio_object"         : record => ({
        "type": "protein",
        ...record.name ? {"name": record.name} : ""
    }),
    "price_model"        : record => _getPriceModel(record, record.crawler_item),
    "description"        : "crawler_item.description",
    "supplier"           : record => import_utils.get_canonical("GenomeMe", ":supplier"),
    "distributor"        : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "host"               : record => import_utils.get_canonical(record.crawler_item.host || "", [":host", ":reactivity"]),
    "clonality"          : record => import_utils.get_canonical(record.crawler_item.host || "", ":clonality"),

    "images"             : record =>  _getImages(record.crawler_item),
    "pdf"                : record =>  _getPdf(record.crawler_item),
    "supplier_specific"  : record => ({
        link : record.crawler_item.url,
        ...record.crawler_item ? {"positive_control" : record.crawler_item.positive_control} : "",
        ...record.crawler_item ? {"dilution_range"  : record.crawler_item.range} : ""
    })
};

let mapping_step2 = {
    "host_relations"          : record => record.host && record.host.length? record.host.map(([,key]) => key) : null,
    "clonality_relations"     : record => record.clonality && record.clonality.length ? record.clonality.map(([,key]) => key) : null,
    "supplier_relations"      : record => record.supplier && record.supplier.length ? record.supplier.map(([,key]) => key) : null,
    "distributor_relations"   : record => record.distributor && record.distributor.length ? record.distributor.map(([,key]) => key) : null,
    "ui"                      : record =>  relation_fields.reduce((res, field_name) => {
        if (record[field_name] && record[field_name].length)
            res[field_name] = record[field_name].map(([,,name]) => name);
        return res
    }, {}),

    "search_data": record =>
    {
        let result = [];

        let name_alias = record.name.split("(").pop().trim();

        if (name_alias.indexOf(")") !== -1)
        {
            result.push({key: "name", text : name_alias.replace(")", "").trim()});
        }

        if (record.bio_object.name)
        {
            result.push({key: "bio_object.name", text : record.bio_object.name})
        }

        (record.bio_object.aliases || []).forEach((alias, index) => {
            result.push({key: "bio_object.aliases." + index, text : alias})
        });

        relation_fields.forEach(field_name =>
        {
            if (!record[field_name] || !record[field_name].length)
                return;

            record[field_name].forEach(([,,name,,synonyms],index) => {
                if (!name || !name.trim())
                    return;
                result.push({key: `${field_name}.${index}`, text : name});
                if (synonyms && synonyms.length)
                {
                    synonyms.forEach(({name}) => {
                        result.push({key: `${field_name}.${index}`, text : name})
                    })
                }
            })
        });

        return result
    }
};

let convert = (item, crawler_item) =>
{
    let record = Object.assign({}, item, {crawler_item: crawler_item || {}});
    let result_step1 = utils.mapping_transform(mapping_step1, record);
    let result_step2 = utils.mapping_transform(mapping_step2, result_step1);
    let result = Object.assign(result_step1, result_step2);

    let suggest_data = import_utils.build_suggest_data_antibody_elisa_kit(result, relation_fields, "antibody");

    relation_fields.forEach(name => delete result[name]);

    return {converted_item : result, suggest_data}
};

module.exports = {
    convert
};