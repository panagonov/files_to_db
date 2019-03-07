let utils        = require("../../../../../_utils/utils.js");
let import_utils = require("../../../../_utils/save_utils.js");

let _get_volume = name =>
{
    let match = /\d+\.?(\d+)?\-?(\d+\.?(\d+)?)?\s(ul|ml)/i.exec(name);

    if (match)
    {
        let result = {};
        let [volume, dimension] = match[0].split(" ");

        result.value = parseFloat(volume);
        result.dimension = dimension;

        return result;
    }

   return null
};

let mapping = {
    "volume"         : record => _get_volume(record.name)
};

let convert = (record, result_to_enrich) =>
{
    let result = utils.mapping_transform(mapping, record);

    return result
};

module.exports = convert;