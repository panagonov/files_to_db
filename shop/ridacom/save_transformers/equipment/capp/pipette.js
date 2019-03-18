let utils        = require("../../../../../_utils/utils.js");
let import_utils = require("../../../../_utils/save_utils.js");

let _get_current_specs = (record) => {
    let crawler_item = record.crawler_item;

    if (!crawler_item || !crawler_item.specification || !crawler_item.specification.length)
        return null;

    return crawler_item.specification.filter(data => data.oid === record.oid)[0];
};

let _get_imprecision = record =>
{
    let current_specs = _get_current_specs(record);
    let result = {};

    if (current_specs  && current_specs["imprecision_%"])
    {
        let params = current_specs["imprecision_%"].split("/").map(val => parseFloat(val)).sort((a,b) => a-b);
        if (params[1]) {
            result.value_range = {
                from: {"value": params[0], "dimension" : "%"},
                to: {"value": params[1], "dimension" : "%"}
            }
        }
        else {
            result.value =  params[0];
            result.dimension = "%"
        }
    }

    return utils.isEmptyObj(result) ? null : result
};


let _get_inaccuracy = record =>
{
    let current_specs = _get_current_specs(record);
    let result = {};

    if (current_specs  && current_specs["inaccuracy_%"])
    {
        let params = current_specs["inaccuracy_%"].split("/").map(val => parseFloat(val)).sort((a,b) => a-b);
        if (params[1]) {
            result.value_range = {
                from: {"value": params[0], "dimension" : "%"},
                to: {"value": params[1], "dimension" : "%"}
            }
        }
        else {
            result.value =  params[0];
            result.dimension = "%"
        }
    }

    return utils.isEmptyObj(result) ? null : result;
};

let _get_color = record =>
{
    let current_specs = _get_current_specs(record);
    let result = "";

    if (current_specs  && current_specs["Color"])
    {
        result = current_specs["Color"]
    }
    else
    {
        let match = /Violet|Grey|Red|Yellow|White|Blue|Green|Orange|Purple/i.exec(record.name);
        if (match && match.length)
            result = match[0]
    }

    return result ? result : null
};

let _get_channel = record =>
{
    let crawler_item = record.crawler_item;
    let value = 0;

    if (record.name.indexOf("single channel") !== -1 || (crawler_item.sub_sub_category || "").toLowerCase().indexOf("single channel") !== -1)
    {
        value = 1;
    }
    else
    {
        let match = /(\d+)\-channel/.exec(record.name);
        if (match && match[1])
            value = parseInt(match[1], 10)
    }

    return value
};

let get_step_volume = record =>
{
    let name = record.name;
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

let _get_volume = record =>
{
    let name = record.name;
    let match = /\s\d+\.?(\d+)?\-?(\d+\.?(\d+)?)?\s?(ul|ml)/i.exec(name);

    if (match)
    {
        let result = {};
        let [, volume, dimension] = match[0].split(" ");
        if (volume.indexOf("-") !== -1)
        {
            let range = volume.split("-");
            if (!dimension && range[1]){
                let size = import_utils.size_parser(range[1]);
                range[1] = size.value;
                dimension = size.dimension;
            }

            result.value_range = {
                from :  { value: parseFloat(range[0]), dimension: dimension },
                to :  { value: parseFloat(range[1]), dimension: dimension }
            }
        }
        else
        {
            result = { value: parseFloat(volume), dimension: dimension }
        }

        return result;
    }
    else
    {
        return get_step_volume(name)
    }
};

let mapping = {
    "imprecision"         : _get_imprecision,
    "inaccuracy"          : _get_inaccuracy,
    "color"               : _get_color,
    "channel"             : _get_channel,
    "volume"              : _get_volume,
};

let convert = (record, result_to_enrich) =>
{
    let result = utils.mapping_transform(mapping, record);

    return result
};

module.exports = convert;