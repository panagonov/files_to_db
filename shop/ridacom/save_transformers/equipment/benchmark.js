const csvtojson                  = require("csvtojson");
let utils                        = require("../../../../_utils/utils.js");
let import_utils                 = require("../../../_utils/save_utils.js");
let product_props_parser         = require("./parse_from_csv/equipment_universal_parser.js");
let id_fixes_map                 = require("./benchmark/id_fixer_map.json");
let main_product_id_fixator_list = require("./benchmark/main_products.json");

let collection_name = "product";
let relation_fields = ["supplier", "distributor", "category", "sub_category"];

let category_hash = {};
let product_props = {};

main_product_id_fixator_list = main_product_id_fixator_list.reduce((res, item) => {
    if (!/\-E$/.test(item))
        res[item + "-E"] =1;
    res[item] = 1;
    return res
}, {});

let read_props = async (files) =>
{
    for (let i = 0; i < files.length; i++)
    {
        let jsonObj = await csvtojson().fromFile(files[i]);

        product_props = Object.assign(product_props, jsonObj.reduce((res, item) => {
                res[item.oid] = item;
                res[item.oid + "-E"] = item;
                res[item.oid.replace(/\-E$/, "")] = item;
                res[item.oid.replace(/\*$/, "")] = item;
                res[item.oid.replace(/\*$/, "-E")] = item;
                res[item.alternative_oid] = item;
                if (id_fixes_map[item.oid])
                    res[id_fixes_map[item.oid]] = item;
                return res
            }, {})
        )
    }
};

read_props([`${__dirname}/benchmark/props.csv`, `${__dirname}/benchmark/enzyme_props.csv`])
.then(()=>{})
.catch(e => console.error(e));


let get_real_oid = oid =>
{
    return id_fixes_map[oid] || oid.replace(/\*?([-|~]E)?\*?$/,"")
};

let _check_is_main_product =  record => !!(main_product_id_fixator_list[record.oid] || record.crawler_item[get_real_oid(record.oid)]);

let _get_main_product =  record => (record.crawler_item.table_specification || []).filter(item => record.crawler_item[get_real_oid(item.oid)])[0];


let load_crawler_data = async(items, crawler_db) => {
    let get_id_variations = oid =>{
        return utils.uniq( [oid, id_fixes_map[oid], oid.replace("-", "~")]
            .filter(item => item)
            .reduce((r, it) =>{
                let clean_oid = it.replace(/\*?([-|~]E)?\*?$/,"");
                r.push(it, clean_oid, clean_oid +"*", clean_oid +"-E", clean_oid + "*-E", clean_oid + "-E*", clean_oid +"~E", clean_oid + "*~E", clean_oid + "~E*");
                return r
            }, [])
        );};


    let ids = items.reduce((res,item) => {
        let new_ids = get_id_variations(item.oid);
        return res.concat(new_ids)
    }, []);

    let crawler_data = await crawler_db.read(collection_name, {body: {"src" : "benchmark", "table_specification.oid" : {$in : ids}}});

    let hash = {};
    crawler_data.forEach(item => {
        (item.table_specification || []).forEach(res => {
            let all_oids = get_id_variations(res.oid);
            all_oids.forEach(oid => {
                hash[oid] = Object.assign(item, res);
            })
        });
    });

    let crawler_data_by_name = await crawler_db.read(collection_name, {body: {"src" : "benchmark", "table_specification.name" : {$in : ids}}});

    crawler_data_by_name.forEach(item => {
        (item.table_specification || []).forEach(res => {
            hash[res.name] = Object.assign(item, res);
        });
    });

    return hash
};

let _get_product_relations = (record) => {
    let oid = get_real_oid(record.oid);
    if (record.crawler_item) {
        let res = [];

        if (record.crawler_item[id_fixes_map[record.oid] || record.oid])
            oid = id_fixes_map[record.oid] || record.oid;

        if(record.crawler_item.table_specification) {
            res = record.crawler_item.table_specification.filter(item => item.oid).reduce((res, item) => {
                if (item.oid !== oid)
                    res.push(`PRODUCT_SOURCE:[BENCHMARK]_SUPPLIER:[RIDACOM]_ID:[${get_real_oid(item.oid)}]`);
                return res
            }, []);
        }
        if (res.length)
            return res;
    }
    return null;
};

let _get_product_category = record => {
    let is_main_product = _check_is_main_product(record);
    let result = [];

    if (is_main_product){
        result = import_utils.get_canonical(record.name.replace("™", " "), ":product_category");

        if (!result.length && !utils.isEmptyObj(record.crawler_item)){
            result = import_utils.get_canonical((record.crawler_item.name || record.name).replace("™", " ") || "", ":product_category");
        }
    }

    return result.length ? result :import_utils.get_canonical("other lab accessories", ":product_category");
};

let _get_product_sub_category = record => {
    let is_main_product = _check_is_main_product(record);

    let result = import_utils.get_canonical(record.name.replace("™", " "), ":product_sub_category");
    if (!result.length)
        result = import_utils.get_canonical((record.crawler_item.name || "").replace("™", " "), ":product_sub_category");
    if (!result.length && !is_main_product){
        let main_product = _get_main_product(record);
        if (main_product) {
            result = import_utils.get_canonical((main_product.name || "").replace("™", " "), ":product_category");
            if (!result.length)
                result = import_utils.get_canonical((main_product.name || "").replace("™", " "), ":product_sub_category");
        }
    }
    return result
};

let _get_images = record =>
{
    if (record.crawler_item.product_relations) {
        for (let i = 0; i < record.crawler_item.product_relations.length; i++){
            let relation = record.crawler_item.product_relations[i];
            let oid = relation.oid.split("\n").shift().trim();

            if (oid.indexOf(" with ") !== -1)
                oid = oid.split(" with ").pop();

            if (oid === record.oid && relation.image )
                return [{link: relation.image}]
        }
    }

    if (record.crawler_item.images)
    {
        return record.crawler_item.images
    }
    return null
};

let _get_original_link = record =>
{
    return record.crawler_item.link
};


let mapping = {
    "name"                : "name",
    "oid"                 : "oid",
    "human_readable_id"   : record => `benchmark_scientific_${import_utils.human_readable_id(record.name, record.oid)}`,
    "external_links"      : record => [{"key": "benchmark", "id": record.oid}],
    "price_model"         : "price",
    "supplier"            : record => {
        let original_link = _get_original_link(record);
        let supplier ="Benchmark Scientific";
        if (original_link && /accuris-usa/.test(original_link))
        {
            supplier += " Accuris"
        }
        return import_utils.get_canonical(supplier, ":supplier");
    },
    "distributor"         : () => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "description"         : "crawler_item.description",
    "category"            : _get_product_category,
    "sub_category"        : _get_product_sub_category,
    "product_relations"   : _get_product_relations,
    "images"              : _get_images,
    "pdf"                 : "crawler_item.pdf",
    "original_link"       : "crawler_item.link"
};

let index = 0;
let stop_after = 0;
let crawler_not_found = [];
let show_in_console = (result, crawler_item, record) =>
{
    if (index >= stop_after) {
        let crawler_found = !utils.isEmptyObj(crawler_item);
        console.table({
            index         : index,
            name          : result.name,
            oid           : result.oid,
            category      : (result.category || []).toString(),
            sub_category  : (result.sub_category || []).toString(),
            all_categories: (result.all_categories || []).toString(),
            supplier      : result.supplier[0],
            crawler       : crawler_found
        });
        if (!crawler_found && !result.original_link) {
            crawler_not_found.push(result.oid);
            console.log("not_found", crawler_not_found.length);
        }

        debugger;
    }
    index++;
};

let convert = (item, crawler_item) =>
{
    // if (stop_after >= 0 && index < stop_after) {        //todo only in test mode
    //     index++;
    //     return item;
    // }

    let missing_data =  [];

    let record = Object.assign({}, item, {crawler_item: crawler_item || {}});

    let result = utils.mapping_transform(mapping, record);

    if (product_props[result.oid]) {
        result = Object.assign(result, product_props_parser(product_props[result.oid], item.src, item.tid));
        if(result.size && result.size.length) {
            result.size.forEach((item, index) => {
                result.price_model.variation[index].size = item;
            });
            delete result.size
        }
    }

    let service_data = import_utils.build_service_data(result, relation_fields);
    result = Object.assign(result, service_data);

    let suggest_data = import_utils.build_suggest_data(result, relation_fields, result.category[0][1]);
    result           = import_utils.clean_result_data(result, relation_fields);

    // show_in_console(result, crawler_item, record);

    category_hash[result.oid] = {category: result.category, sub_category: result.sub_category};

    return {
        converted_item : result,
        suggest_data,
        ...missing_data.length ? {missing_data: missing_data} : ""
    }
};

let get_crawler_item = (item, crawler_hash) =>  {
    let oid = get_real_oid(item.oid);
    return crawler_hash[oid] || crawler_hash[item.oid];
};

module.exports = {
    convert,
    load_crawler_data,
    version: 2,
    get_crawler_item
    // disable: true
};

// console.log(import_utils.get_canonical('BenchMixer V2™ Vortex Mixer with flip top cup head and new counter balance, 230V', ":product_category"))