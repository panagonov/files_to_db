let utils        = require("../../../../../_utils/utils.js");
let import_utils = require("../../../../_utils/save_utils.js");

let _range_parser = value => {
    let plus_minus_range = false;
    if (value.indexOf("±") !== -1){
        plus_minus_range = true;
        value = value.replace("±", "")
    }


    let range = (value || "").split("-");
    let from  = import_utils.size_parser(range[0].trim());
    let to    = import_utils.size_parser((range[1] || "").trim());

    to = utils.isEmptyObj(to) ? null : to;
    from = utils.isEmptyObj(from) ? null : from;

    if (from && to)
    {
        if (!from.dimension && to.dimension)
        {
            from.dimension = to.dimension
        }
        return {
            from: from,
            to: to
        }
    }
    else if (!to && from){
        if (plus_minus_range)
        {
            return {
                from: {value: -from.value, dimension: from.dimension},
                to : from
            }
        }


        return {
            to : from
        }
    }

    return null
};

let _array_range_parser = value =>
    _text_to_array(value).filter(item => item).map(item => _range_parser(item));


let _size_parser = value => {
    let result = import_utils.size_parser(value);
    return utils.isEmptyObj(result) ? null : result;
};

let _step_parser = value => {
    let items = value.split(",").map(item => import_utils.size_parser(item.trim()));
    let dimension = items.filter(item => item.dimension)[0];
    if (dimension)
        dimension = dimension.dimension;

    if (dimension)
        items= items.map(item =>{
            item.dimension = dimension;
            return item;
        });

    return items.filter(item => !utils.isEmptyObj(item))
};

let _dimension_parser = value => {
    let sizes = value.split("x").map(item => item.trim());
    let width = import_utils.size_parser(sizes[0]);
    let depth = import_utils.size_parser(sizes[1]);
    let height = import_utils.size_parser(sizes[2]);

    let dimension = width.dimension || depth.dimension  || height.dimension;
    width = width.value;
    depth = depth.value;
    height = height.value;

    if(width || height || depth)
    {
        return {
            ...width ? {width} : "",
            ...depth ? {depth} : "",
            ...height ? {height} : "",
            ...dimension ? {dimension} : ""
        }
    }

    return null
};

let _text_to_array = value => {
    value = value.replace(/\n/g, ";");
    return value.split(";").map(item => item.trim())
};

let _number_parser = value =>
    parseFloat(value);

let _string_parser = value =>
    (value || "").replace(/\s/g," ").trim();

let _category_parser = value => {
    let result = _text_to_array(value);
    return result.reduce((res, value) =>{
        res = res.concat(import_utils.get_canonical(value.replace(/_/g, " "), ":product_category"));
        return res;
    }, [])
};

let _sub_category_parser = value => {
    let result = _text_to_array(value);
    return result.reduce((res, value) =>{
        res = res.concat(import_utils.get_canonical(value.replace(/_/g, " "), ":product_sub_category"));
        return res;
    }, [])
};

let parsers = {
    rpm                 : _range_parser,
    capacity            : _array_range_parser,
    noise_level         : _range_parser,
    overall_dimensions  : _dimension_parser,
    voltage             : _step_parser,
    product_relations   : _text_to_array,
    electric_power      : _step_parser,
    electric_frequency  : _range_parser,
    weight              : _size_parser,
    warranty            : _size_parser,
    program_memory      : _number_parser,
    channel             : _number_parser,
    cord_length         : _size_parser,
    temperature_settings: _range_parser,
    temperature_accuracy: _size_parser,
    ramp_rate           : _range_parser,
    category            : _category_parser,
    sub_category        : _sub_category_parser,
    volume              : _range_parser,
    inaccuracy          : _range_parser,
    imprecision         : _range_parser,
    color               : _string_parser,
    name                : _string_parser,
    original_link       : _string_parser,
};

let convert = (specifications) => {

    let result = Object.keys(specifications).reduce((res, field_name) => {
        if (parsers.hasOwnProperty(field_name)) {
            let field_value = parsers[field_name](specifications[field_name]);

            if (field_value instanceof Array && !field_name.length)
                return res;
            else if (field_value instanceof Object && utils.isEmptyObj(field_value))
                return res;
            else if (!field_value)
                return res;

            res[field_name] = field_value;
            return res;
        }
        return res;
    }, {});

    return result
};

module.exports = convert;


// console.log(_sub_category_parser("pipette_accessories"));