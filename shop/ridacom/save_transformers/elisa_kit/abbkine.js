let utils        = require("../../../../_utils/utils.js");
let Mongo_db     = require("../../../../_utils/db.js");
let import_utils = require("../_utils.js");

let uniprot_db;

let relation_fields = ["reactivity", "conjugate", "test_method", "supplier", "distributor"];

let init = async() =>
{
    uniprot_db = new Mongo_db();
    await uniprot_db.init({database: "uniprot"});
};

let _getImages = item => {
    let result = [];

    if(item.images && item.images.length)
    {
        item.images.map((link, index) => {
            let text = item.images_text && item.images_text[index];
            return {
                link: link,
                ...text ? {text: text} : ""
            }
        })
    }

    return result
};

let _getPdf = item =>
{
    let result = [];

    if(item.pdf)
    {
        result.push({
            link: item.pdf,
        })
    }

    return result.length ? result : null;
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

let _get_bio_object = record =>
{
    if (!record.bio_object_data)
        return null;

    return {
        "type": "protein",
        ...record.bio_object_data &&  record.bio_object_data.name ? {"name": record.bio_object_data.name} : "",
        ...record.bio_object_data ? {"aliases": [record.bio_object_data._id, record.bio_object_data.alias]} : ""
    }
};

let mapping_step1 = {
    "name"               : "name",                                                                                                  //ok
    "oid"                : "oid",                                                                                                   //ok
    "human_readable_id"  : record => import_utils.human_readable_id(record.name) + "_" + record.oid,                                //ok
    "external_links"     : record => [{"key": "abbkine", "id": record.oid}],                                                        //ok
    "description"        : "background",                                                                                            //ok
    "bio_object"         : record => _get_bio_object(record),
    "price_model"        : record => _getPriceModel(record, record.crawler_item),                                                   //ok
    "supplier"           : record => import_utils.get_canonical("Abbkine Scientific Co., Ltd.", ":supplier"),                       //ok
    "distributor"        : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),                                    //ok
    "conjugate"          : record => import_utils.get_canonical(record.conjugate, ":conjugate"),                                    //ok
    "test_method"        : record => import_utils.get_canonical(record.detection_method, ":test_method"),                           //ok
    "formulation"        : "formulation",                                                                                           //ok
    "usage"              : "usage_notes",                                                                                           //ok
    "storage_conditions" : "storage_instructions",                                                                                  //ok
    "delivery_conditions": "shipping",                                                                                              //ok
    "images"             : record =>  _getImages(record.crawler_item),
    "pdf"                : record =>  _getPdf(record.crawler_item),
    "supplier_specific"  : record => ({
        "link"             : record.link,
        ...record.calibration_range ? {"calibration_range": record.calibration_range}   : "",
        ...record.alternative       ? {"alternative": record.alternative}               : "",
        ...record.precautions       ? {"precautions": record.precautions}               : "",
        ...record.gene_id           ? {"gene_id": record.gene_id}                       : ""
    }),
    "sensitivity"       : "limit_of_detection",                                                                                     //ok
    "sample_type"       : "sample_type",                                                                                            //ok
    "assay_length"      : "assay_duration",                                                                                         //ok
    "kit_components"    : "kit_components",                                                                                         //ok
};

let mapping_step2 = {
    "reactivity_relations"    : record => record.reactivity && record.reactivity.length? record.reactivity.map(([,key]) => key) : null,
    "conjugate_relations"     : record => record.conjugate && record.conjugate.length? record.conjugate.map(([,key]) => key) : null,
    "test_method_relations"   : record => record.test_method && record.test_method.length ? record.test_method.map(([,key]) => key) : null,
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

let convert = (item, crawler_item, custom_data) =>
{
    let bio_object_data = custom_data[item.accession];

    let record = Object.assign({}, item, {crawler_item: crawler_item, bio_object_data : bio_object_data});
    let result_step1 = utils.mapping_transform(mapping_step1, record);
    let result_step2 = utils.mapping_transform(mapping_step2, result_step1);
    let result = Object.assign(result_step1, result_step2);

    let suggest_data = import_utils.build_suggest_data_antibody_elisa_kit(result, relation_fields, "elisa_kit");

    relation_fields.forEach(name => delete result[name]);

    return {converted_item : result, suggest_data}
};

let load_custom_data = async(mongo_db,crawler_db, result) => {

    let ids = result.map(item => item.accession);
    let bio_objects = await uniprot_db.read("uniprot", {body: {_id : {$in : ids}}});
    console.log(`Found ${bio_objects.length}/${ids.length} bio-objects`);
    let hash = bio_objects.reduce((res, item) => {
        res[item._id] = item;
        return res;
    }, {});

    return hash;
};

module.exports = {
    convert,
    load_custom_data,
    init
};

// console.log(import_utils.get_canonical("Competitive Inhibition", [":test_method"]));