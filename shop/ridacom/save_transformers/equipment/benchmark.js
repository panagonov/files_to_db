let utils        = require("../../../../_utils/utils.js");
let import_utils = require("../../../_utils/save_utils.js");
let fixator      = require("./benchmark/fixator.js");

let collection_name = "product";
let relation_fields = ["supplier", "distributor", "category", "sub_category"];

let id_fixes_map = {
    "BV1003-T150" : "BV1003-150",
    "BV1003-T500" : "BV1003-500",
    "B2000-8-T500" : "B2000-8-500",
    "H2505-40E" : "H2505-40",
    "H2505-70E" : "H2505-70",
    "H2505-130E" : "H2505-130"
};

let get_real_oid = oid =>
{
    return id_fixes_map[oid] || oid.replace(/\-E$/, "")
}

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
            if (item.oid) {
                let related = typeof item.oid === "string" ? [item.oid] : item.oid;
                related.forEach(oid => res.push(`PRODUCT_SOURCE:[BENCHMARK]_SUPPLIER:[RIDACOM]_ID:[${oid}]`));
            }
            return res;
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
    "images"              : "crawler_item.images",
    "pdf"                 : "crawler_item.pdf",
    "original_link"       : "crawler_item.link"
};

let index = 0;
let show_in_console = (result, crawler_item, record) =>
{
    if (index >= 314) {
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
    let missing_data =  [];
    let supplies = custom_data[id_fixes_map[item.oid] || item.oid];

    let record = Object.assign({}, item, {crawler_item: crawler_item || {}, supplies : supplies});

    let result = utils.mapping_transform(mapping, record);
    result = fixator(result, record);

    let service_data = import_utils.build_service_data(result, relation_fields);
    result = Object.assign(result, service_data);

    // let additional_data = get_additional_category_data(record, result);
    // result = Object.assign(result, additional_data);


    let suggest_data = import_utils.build_suggest_data(result, relation_fields, result.category[0][1]);
    result           = import_utils.clean_result_data(result, relation_fields);

    show_in_console(result, crawler_item, record);

    // if (utils.isEmptyObj(crawler_item) && !supplies)
    //     debugger

    return {
        converted_item : result,
        suggest_data,
        ...missing_data.length ? {missing_data: missing_data} : ""
    }
};

let load_custom_data = async(mongo_db, crawler_db, result) => {

    let ids = utils.uniq(result
        .map(item => id_fixes_map[item.oid] || item.oid)
        .filter(id => id)
    );

    let crawler_data = await crawler_db.read("product", {body: {"src" : "benchmark", "table_specification.oid" : {$in : ids}}});

    let hash = {};
    crawler_data.forEach(item => {
        (item.table_specification || []).forEach(res => {
            hash[res.oid] = hash[res.oid] || {};
            hash[res.oid].item = res;
            hash[res.oid].related = hash[res.oid].related || [];
            hash[res.oid].related.push(item)


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
    version: 1
};

// console.log(import_utils.get_canonical("BactiZapper™ Infrared MicroSterilizer, 230V", ":product_sub_category"))