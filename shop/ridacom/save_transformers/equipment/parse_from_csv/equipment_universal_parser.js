let utils        = require("../../../../../_utils/utils.js");
let import_utils = require("../../../../_utils/save_utils.js");
let render_specs = require("../../../../../../bioseek/discovery/core/_auto_generate_config/render_specs.json");
let transform_fns  = {};

utils.objEach(render_specs, (key, value) => {
    (value || []).forEach(item => {
        transform_fns[item.name] = item.transform_fn
    })
});

let _range_parser = value => {
    let plus_minus_range = false;
    if (value.indexOf("±") !== -1){
        plus_minus_range = true;
        value = value.replace("±", "")
    }


    let range = (value || "").replace(" to ", "-").split("-");
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

let _array_range_parser = value =>{
    value = (value || "").replace(/,/g, ";");
    return _text_to_array(value).filter(item => item).map(item => _size_parser(item)).filter(item => item);
};

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
    return value.split(";").map(item => item.trim()).filter(item => item)
};

let _number_parser = value =>
    parseFloat(value);

let _string_parser = value =>
    (value || "").replace(/\s/g," ").trim();


let _images_parser = value => {
    return _text_to_array(value).map(link =>({link}))
}

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
    "plainText"         : _string_parser,
    "arrayToText"       : _text_to_array,
    "arrayToParagraphs" : _text_to_array,
    "dimensionValue"    : _range_parser,
    "arrayOfDimensions" : _array_range_parser,
    "sizeDimensionValue": _dimension_parser,
    "number"            : _number_parser,
    "images"            : _images_parser,

    "product_relations" : _text_to_array,
    "category"          : _category_parser,
    "sub_category"      : _sub_category_parser,
};

let unused_fields = ["oid", "alternative_oid"];
let convert = (specifications) => {

    let clear_specs = {};
    utils.objEach(specifications, (key, value) => value && value.trim() ? clear_specs[key] = value : null);

    let result = Object.keys(clear_specs).reduce((res, field_name) => {
        let transform_fn_name = transform_fns[field_name];
        let transform_fn = parsers[transform_fn_name] || parsers[field_name];

        if (transform_fn) {
            let field_value = transform_fn(specifications[field_name]);

            if (field_value instanceof Array && !field_name.length)
                return res;
            else if (field_value instanceof Object && utils.isEmptyObj(field_value))
                return res;
            else if (!field_value)
                return res;

            res[field_name] = field_value;
            return res;
        }
        else if (unused_fields.indexOf(field_name) === -1)
        {
            console.error(`Parser for field "${field_name}" was not found ${transform_fn_name}`)
        }
        return res;
    }, {});

    let specs_fields = Object.keys(clear_specs).filter(item => unused_fields.indexOf(item) === -1).length;
    let result_fields = Object.keys(result).length;

    if (specs_fields.length !== result_fields.length)
    {
        console.error("Missing transformed fields");
        console.error(JSON.stringify(specs_fields.filter(item => result_fields.indexOf(item) === -1)));
    }

    // if (["R4040","BSH200"].indexOf(specifications.oid) !== -1)
    //     debugger //capacity, ramp_timer_range

    return result
};

module.exports = convert;


// console.log(_range_parser("4 to +65°C"));