let semantica    = require("../../../../common-components/search-engine-3/domains/genetics/index.js");
let utils        = require("../../../../_utils/utils.js");
let Mongo_db     = require("../../../../_utils/db.js");
let import_utils = require("../_utils.js");

let uniprot_db;

let relation_fields = ["host", "reactivity", "application", "isotype", "light_chain", "heavy_chain", "clonality" , "research_area", "supplier", "distributor", "conjugate"];

let init = async() =>
{
    uniprot_db = new Mongo_db();
    await uniprot_db.init({database: "uniprot"});
}


let get_canonical = (text, type) =>
{
    if (typeof type === "string")
        type = [type];

    let db = semantica.getDb();
    let atoms = semantica.analyseSpeech("eng", text);

    atoms = atoms
    .filter(([atom_type]) => type.indexOf(atom_type) !== -1)
    .map(atom => {
        let synonyms = semantica.knowledge.findTagsByCanonical(db, atom[1]);
        if (synonyms && synonyms.length)
        {
            atom.push(synonyms);
        }

        return atom
    });
    return atoms
};

let _getImages = item => {
    let result = [];

    if(item.images && item.images.length)
    {
        item.images.forEach(link => result.push({link: link}))
    }

    return result
};

let _getPdf = item =>
{
    let result = [];

    if(item.pdf)
    {
        result.push({link: item.pdf})
    }

    return result;
};

let _getPriceModel = (item, crawler_item) =>
{
    let result = {
        ...crawler_item.price && crawler_item.price.length ? {"is_multiple" : true} : "",
        search_price: item.price && item.price[0] ? item.price[0].price || 0 : 0,
        "variation" :[]
    };

    (item.price || []).forEach(price_item => {

        let size = import_utils.size_parser(price_item.size);

        result.variation.push({
            "price" : {
                "value" : price_item.price || 0,
                "currency": "usd"
            },
            "size" : size
        })
    });

    return result;
};

let mapping_step1 = {
    "name"               : "name",
    "oid"                : "oid",
    "human_readable_id"  : record => import_utils.human_readable_id(record.name) + "_" + record.oid,
    "external_links"     : record => [{"key": "abbkine_scientific_co_ltd", "id": record.oid}],
    "bio_object"         : record => ({
        "type": "protein",
        ...record.bio_object_data &&  record.bio_object_data.name ? {"name": record.bio_object_data.name} : "",
        ...record.bio_object_data ? {"aliases": [record.bio_object_data._id, record.bio_object_data.alias]} : ""
    }),
    "price_model"        : record => _getPriceModel(record, record.crawler_item),
    "description"        : "description",
    "supplier"           : record => get_canonical("Abbkine Scientific Co., Ltd.", ":supplier"),
    "distributor"        : record => get_canonical("RIDACOM Ltd.", ":distributor"),
    "host"               : record => get_canonical(record.host || "", [":host", ":reactivity"]),
    "reactivity"         : record => get_canonical((record.reactivity || []).join("; "), [":host", ":reactivity"]),
    "application"        : record => get_canonical((record.application || []).join("; "), ":application"),
    "isotype"            : record => get_canonical(record.isotype || "", ":isotype"),
    "light_chain"        : record => get_canonical(record.isotype || "", ":light_chain"),
    "heavy_chain"        : record => get_canonical(record.isotype || "", ":heavy_chain"),
    "clonality"          : record => get_canonical(record.clonality || "", ":clonality"),
    "conjugate"          : record => get_canonical(record.conjugate || "", ":conjugate"),
    "usage"                 : record =>  record.background && record.background.trim() ? [record.background.replace(/\s+/g, " ").trim()] : null,
    // "research_area"      : record => get_canonical((record.research_area || []).join("; ") || "", ":research_area"),
    // "concentration"      : "concentration",
    // "clone_id"           : "clone_num",
    // "shelf_life"         : "shelf_life",
    "storage_conditions"    : "storage_instructions",
    "delivery_conditions"   : "shipping",
    "buffer_form"           : "storage_buffer",
    "immunogen"             : "immunogen",
    "purification"          : "purification",
    "formulation"           : "formulation",
    "images"             : record =>  _getImages(record.crawler_item),
    "pdf"                : record =>  _getPdf(record.crawler_item),
    "supplier_specific"  : record => ({
        "link"          : record.link,
        "precautions"   : record.precautions,
        "alternative"   : record.alternative,
        "accession"     : record.accession,
        "accession_link": record.accession_link,
        "category"      : record.category,
        "gene_id"       : record.gene_id
    })
};

let mapping_step2 = {
    "host_relations"          : record => record.host && record.host.length? record.host.map(([,key]) => key) : null,
    "reactivity_relations"    : record => record.reactivity && record.reactivity.length? record.reactivity.map(([,key]) => key) : null,
    "application_relations"   : record => record.application && record.application.length? record.application.map(([,key]) => key) : null,
    "isotype_relations"       : record => record.isotype && record.isotype.length? record.isotype.map(([,key]) => key) : null,
    "light_chain_relations"   : record => record.light_chain && record.light_chain.length ? record.light_chain.map(([,key]) => key) : null,
    "heavy_chain_relations"   : record => record.heavy_chain && record.heavy_chain.length ? record.heavy_chain.map(([,key]) => key) : null,
    "clonality_relations"     : record => record.clonality && record.clonality.length ? record.clonality.map(([,key]) => key) : null,
    "conjugate_relations"     : record => record.conjugate && record.conjugate.length ? record.conjugate.map(([,key]) => key) : null,
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

let build_suggest_data = record => {
    let result = {};

    if (record.bio_object && record.bio_object.name)
    {
        let id = `protein_${import_utils.human_readable_id(record.bio_object.name)}`;
        let protein = {
            type    : "protein",
            category: ["antibody"],
            name    : record.bio_object.name,
            aliases : record.bio_object.alias ? [record.bio_object.alias] : []
        };

        let name_alias = record.name.split("(").pop().trim();

        if (name_alias.indexOf(")") !== -1)
            protein.aliases.push(name_alias.replace(")", "").trim());

        result[id] = protein
    }

    relation_fields.forEach(field_name =>
    {
        if (!record[field_name] || !record[field_name].length)
            return;

        record[field_name].forEach(([,key,name,,synonyms]) => {
            if (!name || !name.trim())
                return;

            let id = `${field_name}_${key}`;
            result[id] = {
                type    : field_name,
                category: ["antibody"],
                name    : name,
                aliases : (synonyms || []).map(({name}) => name)
            };
        })
    });

    return result
};

let convert = (item, crawler_item, custom_data) =>
{
    let bio_object_data = custom_data[item.accession];
    try{

        let record = Object.assign({}, item, {crawler_item: crawler_item, bio_object_data : bio_object_data});
        let result_step1 = utils.mapping_transform(mapping_step1, record);
        let result_step2 = utils.mapping_transform(mapping_step2, result_step1);
        let result = Object.assign(result_step1, result_step2);

        let suggest_data = build_suggest_data(result);

        relation_fields.forEach(name => delete result[name]);
        return {converted_item : result, suggest_data}
    }
    catch(e)
    {
        debugger
    }
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