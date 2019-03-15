let utils        = require("../../../../../_utils/utils.js");
let import_utils = require("../../../../_utils/save_utils.js");

let _get_voltage = record =>
{
    let result = {};

    let match = /\d+\.?(\d+)?(\s+)?V/i.exec(record.name);
    if (match && match.length)
    {
        let size = import_utils.size_parser(match[0]);
        result = {
            "value": size.value,
            ...size.dimension ? {"dimension"  : size.dimension.toLowerCase()} : ""
        }
    }

    return utils.isEmptyObj(result) ? null : result
};


let _get_rpm = record =>
{
    let result = {};

    let match = /\d+\.?(\d+)?(\s+)?rpm/i.exec(record.name);
    if (match && match.length)
    {
        let size = import_utils.size_parser(match[0]);
        result = {
            "value": size.value,
            ...size.dimension ? {"dimension" : size.dimension.toLowerCase()} : ""
        }
    }

    return utils.isEmptyObj(result) ? null : result
};

let _get_weight = record =>
{
    let result = {};

    let match = /\d+\.?(\d+)?(\s+)?(g|kg)/i.exec(record.name);
    if (match && match.length)
    {
        let size = import_utils.size_parser(match[0]);
        result = {
            "value": size.value,
            ...size.dimension ? {"dimension" : size.dimension.toLowerCase()} : ""
        }
    }

    return utils.isEmptyObj(result) ? null : result
};


let mapping = {
    "voltage"          : _get_voltage,
    "rpm"              : _get_rpm,
    "weight"           : _get_weight
};

let convert = (record, result_to_enrich) =>
{
    let result = utils.mapping_transform(mapping, record);

    return result
};

module.exports = convert;