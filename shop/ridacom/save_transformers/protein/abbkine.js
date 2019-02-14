let utils        = require("../../../../_utils/utils.js");
let Mongo_db     = require("../../../../_utils/db.js");
let import_utils = require("../_utils.js");

let uniprot_db;

let relation_fields = ["supplier", "distributor", "preparation_method"];

let init = async() =>
{
    uniprot_db = new Mongo_db();
    await uniprot_db.init({database: "uniprot"});
};

let _getImages = item => {
    let result = null;

    if(item.images && item.images.length)
    {
        result = item.images.map((link, index) => {
            let text = item.images_text && item.images_text[index] ? item.images_text[index] : "";
            text = text.replace(/\s+/g, " ").trim();
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
    let result = null;

    if(item.pdf)
    {
        result = [{link: item.pdf}]
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

let _get_bio_object = record =>
{
    if (!record.bio_object_data || !record.bio_object_data.length)
        return null;

    return record.bio_object_data.map(bio_object => ({
        "type": "protein",
        ...bio_object.name                  ? {"name": bio_object.name}                                                 : "",
        ...bio_object.aliases               ? {"aliases": (bio_object.aliases || []).concat(bio_object.ids || [])}      : "",
        ...bio_object.gene                  ? {"gene": bio_object.gene}                                                 : "",
        ...bio_object.organism              ? {"organism": bio_object.organism}                                         : "",
        ...bio_object.ncbi_organism_tax_id  ? {"ncbi_organism_tax_id": bio_object.ncbi_organism_tax_id}                 : "",

    }));
};

let mapping = {
    "name"                  : "name",
    "oid"                   : "oid",
    "human_readable_id"     : record => import_utils.human_readable_id(record.name) + "_" + record.oid,
    "external_links"        : record => [{"key": "abbkine_scientific_co_ltd", "id": record.oid}],
    "bio_object"            : record => _get_bio_object(record),
    "price_model"           : record => _getPriceModel(record, record.crawler_item),
    "supplier"              : record => import_utils.get_canonical("Abbkine Scientific Co., Ltd.", ":supplier"),
    "distributor"           : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "preparation_method"    : record => import_utils.get_canonical(record.preparation_method, [":host", ":reactivity", ":preparation_method"]),
    "description"           : "background",
    "sequence"              : "sequence",
    "activity"              : "activity",
    "protein_length"        : "protein_length",
    "purity"                : "purity",
    "formulation"           : "formulation",
    "molecular_weight"      : "mol_weight",
    "usage"                 : "usage_notes",
    "storage_conditions"    : "storage_instructions",
    "delivery_conditions"   : "shipping",
    "aliases"               : "alternative",
    "precautions"           : "precautions",
    "images"                : record =>  _getImages(record.crawler_item),
    "pdf"                   : record =>  _getPdf(record.crawler_item),
    "original_link"         : "link",
    "supplier_specific"     : record => ({
        ...record.gene_id ? {"gene_id" : record.gene_id} : "",
        ...record.others ? {"others" : record.others} : ""
    })
};

let _get_bio_object_data = (item, custom_data) =>
{
    let bio_ids = (item.accession || "").split("/").map(it => it.trim().split("-").shift());
    let missing_data = [];

    let bio_object_data = bio_ids.reduce((res,id) => {
        if (!custom_data[id])
            missing_data.push(id);
        else
            res.push(custom_data[id]);

        return res
    }, []);

    return {bio_object_data, missing_data}
};

let convert = (item, crawler_item, custom_data) =>
{
    let {bio_object_data, missing_data} = _get_bio_object_data(item, custom_data);

    let record = Object.assign({}, item, {crawler_item: crawler_item, bio_object_data : bio_object_data});

    let result = utils.mapping_transform(mapping, record);
    let service_data = import_utils.build_service_data(result, relation_fields);
    result = Object.assign(result, service_data);

    let suggest_data = import_utils.build_suggest_data_antibody_elisa_kit(result, relation_fields, "protein");

    relation_fields.forEach(name => delete result[name]);

    return {
        converted_item : result,
        suggest_data,
        ...missing_data.length ? {missing_data: missing_data} : ""
    }
};

let load_custom_data = async(mongo_db, crawler_db, result) => {
    let duplicated = [];

    let ids = utils.uniq(result
        .map(item => item.accession)
        .filter(id => id)
        .reduce((res, id) => {
            res = res.concat(id.split("/"));
            res = res.map(it => it.trim().split("-").shift());
            return res
        }, [])
    );
    let bio_objects = await uniprot_db.read("uniprot", {body: {ids : {$in : ids}}});

    let hash = bio_objects.reduce((res, item) => {
        (item.ids || []).forEach(id => {
            if (res[id])
                duplicated.push(id);
            res[id] = item});
        return res;
    }, {});

    duplicated = utils.uniq(duplicated);
    return {
        result: hash,
        ...duplicated.length ? {error: duplicated} : ""
    };
};

module.exports = {
    convert,
    load_custom_data,
    init
};