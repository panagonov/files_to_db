let utils        = require("../../../../../_utils/utils.js");
let import_utils = require("../../../../_utils/save_utils.js");

let relation_fields = ["calibration"];

let _get_capacity = (crawler_item) =>
{
    let specifications = crawler_item ? crawler_item["specifications"] : null;
    if (specifications && specifications["Capacity"])
    {
        if (specifications["Capacity"].indexOf("/") !== -1)
        {
            let range = specifications["Capacity"].split("/");
            let from = import_utils.size_parser(range[0].trim());
            let to = import_utils.size_parser(range[1].trim());

            return {
                value_range : {
                    from: from.value,
                    to: to.value,
                },
                dimension: from.dimension
            }
        }
        else
        {
            let to = import_utils.size_parser(specifications["Capacity"].trim());
            return {
                value_range : {
                    to: to.value,
                },
                dimension: to.dimension
            }
        }
    }

    return null;
};

let _get_calibration = (crawler_item) =>
{
    let specifications = crawler_item ? crawler_item["specifications"] : null;
    if (specifications && specifications["Calibration"])
    {
        return import_utils.get_canonical(specifications["Calibration"], ":balance_calibration")
    }

    return null;
};



let mapping = {
    "capacity"         : record => _get_capacity(record.crawler_item),
    "calibration"      : record => _get_calibration(record.crawler_item),
};

let convert = (record, result_to_enrich) =>
{
    let result = utils.mapping_transform(mapping, record);

    return result
};

module.exports = convert;