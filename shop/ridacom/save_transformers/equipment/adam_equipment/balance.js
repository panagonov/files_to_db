let utils        = require("../../../../../_utils/utils.js");
let import_utils = require("../../../../_utils/save_utils.js");

let get_specification_field = crawler_item =>
{
    return crawler_item ? crawler_item["specifications"] || crawler_item["short_spec"]: null
}

let _get_range_value = (crawler_item, field_name, splitter = "/") => {
    let specifications = get_specification_field(crawler_item);
    if (specifications && specifications[field_name]) {
        if (specifications[field_name].indexOf(splitter) !== -1) {
            let range = specifications[field_name].split(splitter);
            let from  = import_utils.size_parser(range[0].trim());
            let to    = import_utils.size_parser(range[1].trim());

            if (utils.isEmptyObj(from) && utils.isEmptyObj(to))
                return null;
            return {
                from: from,
                to  : to,
            }
        }
        else
        {
            let to = import_utils.size_parser(specifications[field_name].trim());
            if (utils.isEmptyObj(to))
                return null;
            return {
                to: to,
            }
        }
    }
};

let _get_size_value = (crawler_item, field_name) =>
{
    let specifications = get_specification_field(crawler_item);

    if (specifications && specifications[field_name])
    {
        return import_utils.size_parser(specifications[field_name])
    }
    return null
};

let _split_by_separator = (crawler_item, field_name, splitter = ",") =>
{
    let specifications = get_specification_field(crawler_item);

    let result = [];

    if (specifications && specifications[field_name])
    {
        result = specifications[field_name].split(splitter).map(item => item.trim()).filter(item => item)
    }

    return result.length ? result : null
};

let get_calibration = crawler_item =>
{
    let specifications = get_specification_field(crawler_item);
    if (specifications && specifications["Calibration"])
    {
        return import_utils.get_canonical(specifications["Calibration"], ":balance_calibration")
    }

    return null;
};

let get_overall_dimensions = crawler_item => {
    let specifications = get_specification_field(crawler_item);

    if (specifications && specifications["Overall Dimensions"])
    {
        let [dimensions] = specifications["Overall Dimensions"].split(" ");

        let [width, dept, height] = dimensions.split("x");
        height = height ? import_utils.size_parser(height) : null;

        return {
            ...width ? {width : parseFloat(width)} : "",
            ...dept ? {dept : parseFloat(dept)} : "",
            ...height ? {height : parseFloat(height.value)} : "",
            ...height ? {dimension : height.dimension} : ""
        }
    }

    return null
};

let get_stabilization_time = crawler_item =>
{
    let result = _get_size_value(crawler_item, "Stabilization Time");

    if (result && !result.dimension)
        result.dimension = "s";

    return result;
};


let get_battery_life = crawler_item =>
{
    let result = _get_size_value(crawler_item, "Battery Life (Hours)");

    if (result && !result.dimension)
        result.dimension = "h";

    return result;
};

let mapping = {
    "capacity"              : record => {
        return record.crawler_item.oid && record.crawler_item.oid.indexOf("Calibration Weight") !== -1 ?
            null :
            [_get_range_value(record.crawler_item, "Capacity")].filter(item => item);
    },
    "readability"           : record => _get_range_value(record.crawler_item, "Readability"),
    "linearity"             : record => _get_range_value(record.crawler_item, "Linearity"),
    "repeatability"         : record => _get_range_value(record.crawler_item, "Repeatability"),
    "operating_temperature" : record => _get_range_value(record.crawler_item, "Operating Temperature", "to"),
    "display_digit_height"  : record => _get_size_value(record.crawler_item, "Display Digit Height"),
    "net_weight"            : record => _get_size_value(record.crawler_item, "Net Weight"),
    "pan_size"              : record => _get_size_value(record.crawler_item, "Pan Size"),
    "interface"             : record => _split_by_separator(record.crawler_item, "Interface"),
    "weighing_units"        : record => _split_by_separator(record.crawler_item, "Weighing Units"),
    "electrical_safety_mark": record => _split_by_separator(record.crawler_item, "Electrical Safety Mark"),
    "calibration"           : record => get_calibration(record.crawler_item),
    "overall_dimensions"    : record => get_overall_dimensions(record.crawler_item),
    "stabilization_time"    : record => get_stabilization_time(record.crawler_item),
    "battery_life"          : record => get_battery_life(record.crawler_item),
    "approvals"             : record => record.crawler_item && record.crawler_item.specifications && record.crawler_item.specifications["Approvals"] && record.crawler_item.specifications["Approvals"] !== "N/A" ? record.crawler_item.specifications["Approvals"].trim() : null,
    "construction"          : "crawler_item.specifications.Construction",
    "power_supply"          : "crawler_item.specifications.Power Supply"
};

let convert = (record, result_to_enrich) =>
{
    let result = utils.mapping_transform(mapping, record);
    return result
};

module.exports = convert;