let utils        = require("../../../../_utils/utils.js");
let import_utils = require("../_utils.js");

let relation_fields = ["supplier", "distributor", "application"];

let _getImages = item => {
    let result = null;

    if(item.images && item.images.length)
    {
        result = item.images.map(link => ({link: link}))
    }

    return result
};

let _getPdf = item =>
{
    let result = null;

    if(item.pdf)
    {
        result =[{link: item.pdf}]
    }

    return result;
};

let _getPriceModel = (item, crawler_item) =>
{
    let result = {
        ...item.price && item.price.length ? {"is_multiple" : true} : "",
        search_price : item.price ? item.price[0].price : 0,
        "variation" :[]
    };

    (item.price || []).forEach((price_item, index)=>
    {
        let size = import_utils.size_parser(price_item.size);

        result.variation.push({
            "price" : {
                "value"   : price_item.price || 0,
                "currency": "usd",
            },
            "size"    : size
        })
    });

    return result;
};

let mapping_step1 = {
    "name"               : "name",
    "oid"                : "oid",
    "human_readable_id"  : record => import_utils.human_readable_id(record.name) + "_" + record.oid,
    "external_links"     : record => {
                                        let result = [{"key": "abbkine", "id": record.oid}];
                                        if (record.cas_number)
                                            result.push({"key": "cas_number", "id": record.cas_number});
                                        return result;
                           },
    "description"        : "background",
    "price_model"        : record => _getPriceModel(record, record.crawler_item),

    "supplier"           : record => import_utils.get_canonical("Abbkine Scientific Co., Ltd.", ":supplier"),
    "distributor"        : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "application"        : record => import_utils.get_canonical((record.application || []).join("; "), ":application"),
    "formulation"        : "formulation",
    "usage"              : "usage_notes",
    "storage_conditions" : "storage_instructions",
    "delivery_conditions": "shipping",
    "molecular_weight"   : "mol_weight",
    "purification"       : "purification",
    "purity"             : "purity",
    "preparation_method" : "preparation_method",
    "formula"            : "formula",
    "features"           : "features",
    "storage_buffer"     : "storage_buffer",
    "precautions"        : "precautions",
    "alternative"        : "alternative",
    "images"             : record =>  _getImages(record.crawler_item),
    "pdf"                : record =>  _getPdf(record.crawler_item),
    "supplier_specific"  : record => ({
        "link"             : record.link,
        ...record.app_notes ? {"app_notes": record.app_notes} : "",
    })
};

let mapping_step2 = {
    "application_relations"   : record => record.application && record.application.length ? record.application.map(([,key]) => key) : null,
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

        if (record.bio_object)
        {
            if (record.bio_object.name) {
                result.push({key: "bio_object.name", text : record.bio_object.name})
            }
            (record.bio_object.aliases || []).forEach((alias, index) => {
                result.push({key: "bio_object.aliases." + index, text : alias})
            });
        }

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

let convert = (item, crawler_item, custom_data) =>
{
    let bio_object_data = custom_data[item.accession];

    let record = Object.assign({}, item, {crawler_item: crawler_item, bio_object_data : bio_object_data});
    let result_step1 = utils.mapping_transform(mapping_step1, record);
    let result_step2 = utils.mapping_transform(mapping_step2, result_step1);
    let result = Object.assign(result_step1, result_step2);

    let suggest_data = import_utils.build_suggest_data_antibody_elisa_kit(result, relation_fields, "chemical");

    relation_fields.forEach(name => delete result[name]);

    return {converted_item : result, suggest_data}
};

module.exports = {
    convert
};