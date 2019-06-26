let utils            = require("../../../../_utils/utils.js");
let import_utils     = require("../../../_utils/save_utils.js");
let bio_object_utils = require("../../../_utils/bio_object_utils.js");
let transformers     = require("./genome_me/transformers.js");
let bio_object_map   = require("./genome_me/bio_object_map.json");

let relation_fields = ["host", "clonality", "supplier", "distributor", "category"];

let _get_bio_object_data = (item, custom_data) =>
{
    let missing_data = [];
    let gene_id = item.name.split("/").shift();
    let bio_object_data = custom_data[gene_id];

    if (!bio_object_data)
        missing_data = [item.name];

    return {bio_object_data, missing_data}
};

let init = async() =>
{
    await bio_object_utils.init()
};

let mapping = {
    "name"             : "name",
    "oid"              : "oid",
    "positive_control" : "crawler_item.positive_control",
    "dilution_range"   : "crawler_item.range",
    "human_readable_id": record => `genomeme_${import_utils.human_readable_id(record.name, record.oid)}`,
    "external_links"   : record => [{"key": "genomeme", "id": record.oid}],
    "supplier"         : record => import_utils.get_canonical("GenomeMe", ":supplier"),
    "distributor"      : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "category"         : record => import_utils.get_canonical("Antibody", ":product_category"),
    "host"             : record => import_utils.get_canonical(record.crawler_item.host || "", [":host", ":reactivity"]),
    "clonality"        : record => import_utils.get_canonical(record.crawler_item.host || "", ":clonality"),
    "description"      : record => record.crawler_item && record.crawler_item.description ? [record.crawler_item.description] : null,
    "original_link"    : record => record.crawler_item && record.crawler_item.url ? record.crawler_item.url : null,
    "price_model"      : transformers.get_price_model,
    "images"           : transformers.get_images,
    "pdf"              : transformers.get_pdf,
    "bio_object"       : transformers.get_bio_object,

};

let convert = (item, crawler_item, custom_data) =>
{
    let {bio_object_data, missing_data} = _get_bio_object_data(item, custom_data);

    let record = Object.assign({}, item, {crawler_item: crawler_item, bio_object_data: bio_object_data});

    let result = utils.mapping_transform(mapping, record);
    let service_data = import_utils.build_service_data(result, relation_fields);
    result = Object.assign(result, service_data);

    let suggest_data = import_utils.build_suggest_data(result, relation_fields, result.category[0][1]);
    result           = import_utils.clean_result_data(result, relation_fields);

    return {
        converted_item : result,
        suggest_data,
        ...missing_data.length ? {missing_data: missing_data} : ""
    }
};

let load_custom_data = async(mongo_db, crawler_db, result) => {
    let ids = utils.uniq(result
        .map(item => item.name.split("/").shift())
        .filter(id => id)
    );

    let name_result = await bio_object_utils.find_bio_objects(ids, "name");
    let gene_result = await bio_object_utils.find_bio_objects(ids, "gene");

    let uniprod_map_ids = Object.keys(bio_object_map).map(key => bio_object_map[key]);
    let ids_result = await bio_object_utils.find_bio_objects(uniprod_map_ids);

    let hash = Object.assign(name_result.hash, gene_result.hash, ids_result.hash);
    let duplicated = name_result.duplicated.concat(gene_result.duplicated, ids_result.duplicated);

    let res = {};
    utils.objEach(hash, (key, value) => {
        (value.gene || []).forEach(gene_id =>{
            // res[gene_id] = res[gene_id] || [];
            // res[gene_id].push(value);
            res[gene_id] = [value];
            res[gene_id] = utils.uniq(res[gene_id], (item) => item.ncbi_organism_tax_id)
        });
        // res[value.name] = res[value.name] || [];
        // res[value.name].push(value)
        res[value.name] = [value];

        if(uniprod_map_ids.indexOf(key) !== -1)
        {
            let name = Object.keys(bio_object_map).filter(name => bio_object_map[name] === key )[0]
            res[name] = [value]
        }
    });

    return {result: res, error: duplicated.length ? duplicated : null};
};

module.exports = {
    init,
    convert,
    load_custom_data,
    version: 3
};