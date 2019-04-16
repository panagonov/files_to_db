const csvtojson          = require("csvtojson");
let utils                = require("../../../../_utils/utils.js");
let import_utils         = require("../../../_utils/save_utils.js");
let fixator              = require("./benchmark/fixator.js");
let product_props_parser = require("./parse_from_csv/equipment_universal_parser.js");

let collection_name = "product";
let relation_fields = ["supplier", "distributor", "category", "sub_category"];

let category_hash = {};
let product_props = {};

let main_product_id_fixator_list = [
    "W3101A-120", "W3101A-220", "W3002A-120", "W3002A-220", "W3102A-120", "W3102A-220",
    "W3100-120", "W3100A-120", "W3100-210", "W3100A-210",
    "W3200-120", "W3200-300", "W3200-500", "W3200-1200","W3200-3200", "W3200-5000",
    "W3300-120", "W3300-300", "W3300-500", "W3300-1200","W3200-5000", "W3300-10000",
    "W4000-100", "W4000-500", "W1000-100", "W1000-500",
    "P7700-1", "P7700-10", "P7700-20", "P7700-100", "P7700-200", "P7700-1000", "P7700-5M", "P7700-10M",
    "MR9600", "MR9600-E",
    "B4000-M","B4000-M-E", "B4000-16", "B4000-16-E"
];

csvtojson().fromFile(__dirname +"/benchmark/props.csv")
.then((jsonObj)=>{
    product_props = jsonObj.reduce((res, item) => {
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
});

let id_fixes_map = {
    "BV1003-T150" : "BV1003-150",
    "BV1003-T500" : "BV1003-500",
    "B2000-8-T500" : "B2000-8-500",
    "H2505-40E" : "H2505-40",
    "H2505-70E" : "H2505-70",
    "H2505-130E" : "H2505-130",
    "B3D5000*-STK" : "B3D5000-STK",
    "W3300~120" : "W3300-120",
    "W3300~300" : "W3300-300",
    "W3300~500" : "W3300-500",
    "W3300~1200" : "W3300-1200",
    "W3300~5000" : "W3300-5000",
    "W3300~10000" : "W3300-10000",
    "W1105~9" : "W1105-9",
};

let get_real_oid = oid =>
{
    return id_fixes_map[oid] || oid.replace(/\-E$/, "")
};

let load_crawler_data = async(items, crawler_db) => {
    let crawler_ids = items.reduce((res, {oid}) => {
        if (id_fixes_map[oid])
        {
            res.push(id_fixes_map[oid]);
        }
        else if (/\-E$/.test(oid))
        {
            res.push(oid, oid.replace(/\-E$/, ""))
        }
        else {
            res.push(oid)
        }
        return res;
    }, []);
    let crawler_data = await crawler_db.read(collection_name, {body: {oid: {$in : crawler_ids}}});

    let result = crawler_data.reduce((res, item) =>
    {
        if (typeof item.oid === "string"){
            res[item.oid] = item;
        }
        else
        {
            item.oid.forEach(oid => res[oid] = item)
        }
        return res;

    }, {});

    return result
};

let _getProductRelations = (record) => {
    let oid = get_real_oid(record.oid);
    if (record.supplies) {
        return record.supplies.related.reduce((res, item) => {
            let related = [];
            if (item.table_specification && item.table_specification.length) {
                related = item.table_specification.filter(item => item.oid !== oid).map(({oid}) => `PRODUCT_SOURCE:[BENCHMARK]_SUPPLIER:[RIDACOM]_ID:[${oid}]`);
            }
            return res.concat(related);
        }, []);
    } else if (record.crawler_item) {
        let res = [];

        if (record.crawler_item[id_fixes_map[record.oid] || record.oid])
            oid = id_fixes_map[record.oid] || record.oid;

        let relations = record.crawler_item[oid];
        if (relations) {
            (record.crawler_item[oid].related).forEach(item => {
                if (item.oid) {
                    let related = typeof item.oid === "string" ? [item.oid] : item.oid;
                    related.forEach(oid => res.push(`PRODUCT_SOURCE:[BENCHMARK]_SUPPLIER:[RIDACOM]_ID:[${oid}]`));
                }

            });
        }
        if (res.length)
            return res;
    }
};

let mapping = {
    "name"                : "name",
    "oid"                 : "oid",
    "human_readable_id"   : record => `benchmark_scientific_${import_utils.human_readable_id(record.name, record.oid)}`,
    "external_links"      : record => [{"key": "benchmark", "id": record.oid}],
    "price_model"         : "price",
    "supplier"            : record => import_utils.get_canonical("Benchmark Scientific", ":supplier"),
    "distributor"         : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "category"            : record => {
        if (record.supplies)
            return import_utils.get_canonical("Accessories", ":product_category");

        let result = import_utils.get_canonical(record.name.replace("™", " "), ":product_category");

        if (!result.length && !utils.isEmptyObj(record.crawler_item)){
            result = import_utils.get_canonical((record.crawler_item.name).replace("™", " ") || "", ":product_category");
        }
        else if(!result.length){
            result = import_utils.get_canonical("Accessories", ":product_category");
        }

        return result
    },
    "sub_category"        : record => {

        if (record.supplies && record.supplies.related && record.supplies.related.length)
        {
            for (let i = 0; i < record.supplies.related.length; i++)
            {
                let res = import_utils.get_canonical(record.supplies.related[i].name.replace("™", " "), ":product_sub_category");
                if (!res.length)
                    res = import_utils.get_canonical(record.supplies.related[i].name.replace("™", " "), ":product_category");

                 if (res.length)
                     return res
            }
            return [];
        }
        else {

            let result = import_utils.get_canonical(record.name.replace("™", " "), ":product_sub_category");
            if (!result.length)
                result = import_utils.get_canonical((record.crawler_item.name || "").replace("™", " "), ":product_sub_category");
            return result
        }
    },
    "description"         : "crawler_item.description",
    "product_relations"   : record => _getProductRelations(record),
    "images"              : record => {
        if (record.crawler_item.images)
        {
            return record.crawler_item.images
        }
        if (record.supplies && record.supplies.related && record.supplies.related[0] && record.supplies.related[0].product_relations) {
            for (let i = 0; i < record.supplies.related[0].product_relations.length; i++){
                let relation = record.supplies.related[0].product_relations[i];
                let oid = relation.oid.split("\n").shift().trim();
                if (oid === record.oid &&relation.image )
                    return [{link: relation.image}]
            }
            return record.supplies.related[0].images
        }
        return null
    },
    "pdf"                 : "crawler_item.pdf",
    "original_link"       : record =>{
        if(record.crawler_item.link){
            return record.crawler_item.link
        }
        else if(record.supplies && record.supplies.related && record.supplies.related.length){
            return record.supplies.related[0].link
        }

        return null
    }
};

let index = 0;
let stop_after = -1;
let show_in_console = (result, crawler_item, record) =>
{
    if (index >= stop_after) {
        console.table({
            index : index,
            name        : result.name,
            oid         : result.oid,
            category    : (result.category || []).toString(),
            sub_category: (result.sub_category || []).toString(),
            all_categories: (result.all_categories || []).toString(),
            product_relations: (result.product_relations || []).toString(),
        });

        debugger;
    }
    index++;
};

let convert = (item, crawler_item, custom_data) =>
{
    if (stop_after >= 0 && index < stop_after) {        //todo only in test mode
        index++;
        return item;
    }

    let missing_data =  [];
    let supplies = custom_data[id_fixes_map[item.oid] || item.oid];

    if (supplies && main_product_id_fixator_list.indexOf(item.oid) !== -1){
        crawler_item = supplies.related[0];
        crawler_item[item.oid] = {related: []};
        supplies = null
    }

    let record = Object.assign({}, item, {crawler_item: crawler_item || {}, supplies : supplies});

    let result = utils.mapping_transform(mapping, record);
    result = fixator(result, record);

    if (product_props[result.oid]){
        result = Object.assign(result, product_props_parser(product_props[result.oid], item.src, item.tid));
    }

    let service_data = import_utils.build_service_data(result, relation_fields);
    result = Object.assign(result, service_data);

    index
    let suggest_data = import_utils.build_suggest_data(result, relation_fields, result.category[0][1]);
    result           = import_utils.clean_result_data(result, relation_fields);

    // show_in_console(result, crawler_item, record);

    if (["BSH100-CV"].indexOf(result.oid) !== -1)
        debugger

    category_hash[result.oid] = {category: result.category, sub_category: result.sub_category};

    return {
        converted_item : result,
        suggest_data,
        ...missing_data.length ? {missing_data: missing_data} : ""
    }
};

let load_custom_data = async(mongo_db, crawler_db, result) => {

    let ids = result
        .reduce((res,item) =>{
            res.push(id_fixes_map[item.oid] || item.oid);
            res.push(item.oid.replace("-", "~"));
            res.push(item.oid.replace("-", "~") +"-E");
            res.push(item.oid + "-E");
            res.push(item.oid.replace(/\-E$/, ""));
            res.push(item.oid.replace(/\-E$/, "").replace("-", "~"));
            res.push(item.oid.replace(/\*$/, ""));
            res.push(item.oid.replace(/\*$/, "").replace("-", "~"));
            res.push(item.oid.replace(/\*$/, "-E"));
            return res
        }, [])
        .filter(id => id);

    ids = utils.uniq(ids);

    let crawler_data = await crawler_db.read("product", {body: {"src" : "benchmark", "table_specification.oid" : {$in : ids}}});

    let hash = {};
    crawler_data.forEach(item => {
        (item.table_specification || []).forEach(res => {
            let all_oids = utils.uniq([
                res.oid, res.oid.replace("~", "-"),
                res.oid, res.oid.replace("~", "-") + "-E",
                res.oid + "-E",
                res.oid.replace(/\-E$/, ""),
                res.oid.replace(/\-E$/, "").replace("~", "-"),
                res.oid.replace(/\*$/, ""),
                res.oid.replace(/\*$/, "").replace("~", "-"),
                res.oid.replace(/\*$/, "-E")
            ]);
            all_oids.forEach(oid => {
                hash[oid] = hash[oid] || {};
                hash[oid].item = res;
                hash[oid].related = hash[oid].related || [];
                hash[oid].related.push(item)
            })
        });
    });

    let crawler_data_by_name = await crawler_db.read("product", {body: {"src" : "benchmark", "table_specification.name" : {$in : ids}}});

    crawler_data_by_name.forEach(item => {
        (item.table_specification || []).forEach(res => {
            hash[res.name] = hash[res.name] || {};
            hash[res.name].item = res;
            hash[res.name].related = hash[res.name].related || [];
            hash[res.name].related.push(item)
        });
    });


    return {result: hash};
};

let get_crawler_item = (item, crawler_hash) =>  {
    let oid = get_real_oid(item.oid);
    return crawler_hash[oid] || crawler_hash[item.oid];
};


module.exports = {
    convert,
    load_crawler_data,
    load_custom_data,
    get_crawler_item,
    version: 46,
    // disable: true
};

// console.log(import_utils.get_canonical('Aspire™ Laboratory Aspirator includes base with internal vacuum pump, 2L Polycarbonate bottle with lid, silicone tubing, handheld vacuum controller and single channel adapters, 230V', ":product_category"))