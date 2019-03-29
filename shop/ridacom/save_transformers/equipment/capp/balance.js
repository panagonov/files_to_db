let utils        = require("../../../../../_utils/utils.js");
let import_utils = require("../../../../_utils/save_utils.js");

let _get_capacity = record => {

    let match = /(\d+\.?\,?\d+)\/(\d+\.?\,?\d+),/.exec(record.name);
    if (match)
        return {
            to: {
                value : parseFloat(match[2].replace(",", ".")),
                dimension: "g"
            }
        };

    return null
};

let _get_readability = record => {

    let match = /(\d+\.?\,?\d+)\/(\d+\.?\,?\d+)\s?(mg)/.exec(record.name);
    if (match)
        return {
            from: {
                value : parseFloat(match[1].replace(",", ".")),
                dimension: match[3]
            },
            to: {
                value : parseFloat(match[2].replace(",", ".")),
                dimension: match[3]
            }
        };

    return null
};

let mapping = {
    "capacity"          : _get_capacity,
    "readability"       : _get_readability,
};

let convert = (record, result_to_enrich) =>
{
    let result = utils.mapping_transform(mapping, record);

    return result
};

module.exports = convert;