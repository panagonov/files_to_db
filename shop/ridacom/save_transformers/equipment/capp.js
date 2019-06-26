const csvtojson          = require("csvtojson");
let utils                = require("../../../../_utils/utils.js");
let import_utils         = require("../../../_utils/save_utils.js");
let transformers = require("./capp/transformers.js");
let product_props_parser = require("./parse_from_csv/equipment_universal_parser.js");

let relation_fields = ["supplier", "distributor", "category", "sub_category"];

let product_props = {};

csvtojson().fromFile(__dirname +"/capp/props.csv")
.then((jsonObj)=>{
    product_props = jsonObj.reduce((res, item) => {
        res[item.oid] = item;
        return res
    }, {})
});

let mapping = {
    "name"                : "name",
    "oid"                 : "oid",
    "original_link"       : "crawler_item.link",
    "table_specification" : "crawler_item.specification",
    "human_readable_id"   : record => `capp_${import_utils.human_readable_id(record.name, record.oid)}`,
    "external_links"      : record => [{"key": "capp", "id": record.oid}],
    "supplier"            : record => import_utils.get_canonical("CAPP", ":supplier"),
    "sub_category"        : record => import_utils.get_canonical(record.crawler_item.sub_category || "", ":product_sub_category"),
    "distributor"         : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "description"         : record => record.crawler_item && record.crawler_item.description ? [record.crawler_item.description] : null,
    "price_model"         : transformers.get_price_model,
    "product_relations"   : transformers.get_product_relations,
    "images"              : transformers.get_images,
    "pdf"                 : transformers.get_pdf,
    "category"            :transformers.get_category,
};

let index = 0;
let show_in_console = (result, crawler_item1, record) =>
{
    console.table({
        index : index,
        name        : result.name,
        oid    : result.oid,
        category    : (result.category || []).toString(),
        sub_category: (result.sub_category || []).toString(),
        volume      : JSON.stringify(result.volume)
    });

    // if (index >= 31)
    //     debugger;
    index++;
};

let convert = (item, crawler_item, custom_data) =>
{
    let missing_data =  [];
    let crawler_item1 = custom_data[item.oid];
    if (!crawler_item1 && item.oid.indexOf("-") !== -1){
        let oid = item.oid.split("-");
        oid.pop();
        oid = oid.join("-");
        crawler_item1 = custom_data[oid]
    }
    if (!crawler_item1)
        missing_data = [item.oid];

    let record = Object.assign({}, item, {crawler_item: crawler_item1 || {}});

    let result = utils.mapping_transform(mapping, record);

    let additional_data = transformers.get_additional_category_data(record, result);
    result = Object.assign(result, additional_data);

    if (product_props[result.oid]){
        result = Object.assign(result, product_props_parser(product_props[result.oid], item.src, item.tid));
    }

    let service_data = import_utils.build_service_data(result, relation_fields);
    result = Object.assign(result, service_data);

    if (!result.category[0])
        debugger;

    let suggest_data = import_utils.build_suggest_data(result, relation_fields, result.category[0][1]);
    result           = import_utils.clean_result_data(result, relation_fields);

    // show_in_console(result, crawler_item1, record);

    return {
        converted_item : result,
        suggest_data,
        ...missing_data.length ? {missing_data: missing_data} : ""
    }
};

let load_custom_data = async(mongo_db, crawler_db, result) => {

    let ids = utils.uniq(result
        .map(item => item.oid)
        .filter(id => id)
    );

    let crawler_data = await crawler_db.read("product", {body: {"specification.oid" : {$in : ids}}});

    let product_ids = utils.uniq(crawler_data.reduce((res, item) => {
        (item.specification || []).forEach(({oid}) => res.push(oid));

        return res;
    }, []));

    let products =  await mongo_db.read("product", {body: {"oid" : {$in : product_ids}}});

    let product_hash = products.reduce((res, item) => {
        res[item.oid] = item;
        return res;
    }, {});

    let hash = crawler_data.reduce((res, item) =>
    {
        item.sub_products = (item.specification || []).reduce((sub_res, sub_item) => {
            sub_res[sub_item.oid] = product_hash[sub_item.oid];
            return sub_res
        }, {});

        item.specification.forEach(it => {
            res[it.oid] = item
        });

        return res;
    }, {});


    return {result: hash};
};

module.exports = {
    convert,
    load_custom_data,
    version: 2
};

// console.log(import_utils.get_canonical("clinical centrifuge", ":product_category"))