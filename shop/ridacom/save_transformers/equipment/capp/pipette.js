let utils        = require("../../../../../_utils/utils.js");
let import_utils = require("../../../../_utils/save_utils.js");

let _get_imprecision = crawler_item =>
{
    let result = [];

    if (!crawler_item || !crawler_item.specification || !crawler_item.specification.length)
        return null;

    crawler_item.specification.forEach(data => {
        if (data["imprecision_%"])
        {
            let params = data["imprecision_%"].split("/").map(val => parseFloat(val)).sort((a,b) => a-b);
            result.push({
                "product_id" : data.oid,
                ...params[1] ? {"value_range": {from: params[0], to: params[1]}} : {"value" : params[0]},
                "dimension"  : "%"
            })
        }
    });

    return result.length ? result : null
};


let _get_inaccuracy = crawler_item =>
{
    let result = [];

    if (!crawler_item || !crawler_item.specification || !crawler_item.specification.length)
        return null;

    crawler_item.specification.forEach(data => {

        if (data["inaccuracy_%"])
        {
            let params = data["inaccuracy_%"].split("/").map(val => parseFloat(val)).sort((a,b) => a-b);
            result.push({
                "product_id" : data.oid,
                ...params[1] ? {"value_range": {from: params[0], to: params[1]}} : {"value" : params[0]},
                "dimension" : "%"
            })
        }
    });

    return result.length ? result : null
};

let _get_color = crawler_item =>
{
    let result = [];

    if (!crawler_item || !crawler_item.specification || !crawler_item.specification.length)
        return null;

    crawler_item.specification.forEach(data => {
        if (data["Color"])
        {
            result.push({
                "product_id": data.oid,
                "value"     : data["Color"],
            });
        }
    });

    return result.length ? result : null
};

let _get_channel = record =>
{
    let result = [];

    let crawler_item = record.crawler_item;


    let extract_channel = data => {
        let value = 0;
        if (data.name.indexOf("single channel") !== -1 || (crawler_item.sub_sub_category || "").toLowerCase().indexOf("single channel") !== -1)
            value = 1;
        else{
            let match = /(\d+)\-channel/.exec(data.name);
            if (match && match[1])
                value = parseInt(match[1], 10)
        }
        if (value)
        {
            result.push({
                "product_id": data.oid,
                "value"     : value,
            });
        }
    };

    if (!crawler_item || !crawler_item.specification || !crawler_item.specification.length)
    {
        extract_channel({name: record["name"], oid: record.oid})
    }
    else
    {
        crawler_item.specification.forEach(data => {
            if (data["name"])
            {
                extract_channel(data)
            }
        });
    }

    return result.length ? result : null
};


let _get_product_relations = crawler_item =>
{
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

let get_step_volume = name =>
{
    let volume = [];
    let regexp = /\d+\.?(\d+)?(ul|ml)/g;

    let match;
    do {
        match = regexp.exec(name);
        if (match)
            volume.push(import_utils.size_parser(match[0]))
    }
    while(match);


    return volume.length ? {value_step : volume} : null
};

let _get_volume = name =>
{
   let match = /(vol\.|volume)?\s\d+\.?(\d+)?\-?(\d+\.?(\d+)?)?\s(ul|ml)/i.exec(name);

    if (match)
    {
        let result = {};
        let [a, volume, dimension] = match[0].split(" ");
        if (volume.indexOf("-") !== -1)
        {
            let range = volume.split("-");
            result.value_range = {
                from :  parseFloat(range[0]),
                to :  parseFloat(range[1])
            }
        }
        else
        {
            result.value = parseFloat(volume)
        }

        result.dimension = dimension;

        return result;
    }
    else
    {
        return get_step_volume(name)
    }
};

let mapping = {
    "imprecision"         : record => _get_imprecision(record.crawler_item),
    "inaccuracy"          : record => _get_inaccuracy(record.crawler_item),
    "color"               : record => _get_color(record.crawler_item),
    "channel"             : record => _get_channel(record),
    "product_relations"   : record => _get_product_relations(record.crawler_item),
    "volume"              : record => _get_volume(record.name),
};

let convert = (record, result_to_enrich) =>
{
    let result = utils.mapping_transform(mapping, record);

    return result
};

module.exports = convert;