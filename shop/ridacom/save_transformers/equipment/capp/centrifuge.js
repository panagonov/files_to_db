let utils        = require("../../../../../_utils/utils.js");
let import_utils = require("../../../../_utils/save_utils.js");

let _get_voltage = record =>
{
    let crawler_item = record.crawler_item;
    let result = [];

    if (!crawler_item || !crawler_item.specification || !crawler_item.specification.length)
        return null;

    crawler_item.specification.forEach(data => {
        if (data["name"])
        {
            let match = /\d+\.?(\d+)?(\s+)?V/i.exec(data.name);
            if (match && match.length)
            {
                let size = import_utils.size_parser(match[0]);
                result.push({
                    "product_id" : data.oid,
                    "value": size.value,
                    ...size.dimension ? {"dimension"  : size.dimension.toLowerCase()} : ""
                })
            }
        }
    });

    return result.length ? result : null
};


let _get_rpm = record =>
{
    let crawler_item = record.crawler_item;
    let result = [];

    if (!crawler_item || !crawler_item.specification || !crawler_item.specification.length)
        return null;

    crawler_item.specification.forEach(data => {
        if (data["name"])
        {
            let match = /\d+\.?(\d+)?(\s+)?rpm/i.exec(data.name);
            if (match && match.length)
            {
                let size = import_utils.size_parser(match[0]);
                result.push({
                    "product_id" : data.oid,
                    "value": size.value,
                    ...size.dimension ? {"dimension"  : size.dimension.toLowerCase()} : ""
                })
            }
        }
    });

    return result.length ? result : null
};

let _get_weight = record =>
{
    let crawler_item = record.crawler_item;
    let result = [];

    if (!crawler_item || !crawler_item.specification || !crawler_item.specification.length)
        return null;

    crawler_item.specification.forEach(data => {
        if (data["name"])
        {
            let match = /\d+\.?(\d+)?(\s+)?(g|kg)/i.exec(data.name);
            if (match && match.length)
            {
                let size = import_utils.size_parser(match[0]);
                result.push({
                    "product_id" : data.oid,
                    "value": size.value,
                    ...size.dimension ? {"dimension"  : size.dimension.toLowerCase()} : ""
                })
            }
        }
    });

    return result.length ? result : null
};

let _get_product_relations = record =>
{
    let crawler_item = record.crawler_item;
    let result = [];

    if (!crawler_item || !crawler_item.specification || !crawler_item.specification.length)
        return null;

    let cat_with_potential_product_relations = false;

    crawler_item.specification.forEach(data => {

        if (data["imprecision_%"] || data["inaccuracy_%"] || data["Color"])
        {
            cat_with_potential_product_relations = true;
        }
        else if(data["oid"] && cat_with_potential_product_relations)
        {
            result.push(`PRODUCT_SOURCE:[CAPP]_SUPPLIER:[RIDACOM]_ID:[${data["oid"].trim() || ""}]`)
        }
    });

    return result.length ? result : null
};

let mapping = {
    "voltage"          : _get_voltage,
    "rpm"              : _get_rpm,
    "weight"           : _get_weight,
    "product_relations": _get_product_relations
};

let convert = (record, result_to_enrich) =>
{
    let result = utils.mapping_transform(mapping, record);

    return result
};

module.exports = convert;