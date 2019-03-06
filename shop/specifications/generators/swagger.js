let utils = require("../../../_utils/utils.js");

let extract_schema = (value) => {

    if (value.enums)
        return {"type": "string", "enums" : value.enums};

    switch (value.type)
    {
        case "string":
            if (value.format === "date-time") {
                return {"type": "string", "format": "date"};
            }
            return {"type": "string"};
        case "object":
           return {"type": "object", "properties": extract_schema(value.properties)};
        case "array":
            return {"type": "array", "items": extract_schema(value.items)};
        default:
            return value;
    }
};

/**
 *
 * @param {String} type
 * @param {Object} model
 * @param {String} model.title
 * @param {Object} model.json_schema
 * @param {Boolean} [model.swagger_definition]
 * @returns {Object|null}
 */
let run = ({type, model}) => {
    if (!model.swagger_definition)
        return null;

    let schema = {};

    utils.objEach(model.json_schema.properties, (key, value) => {
        schema[key] = extract_schema(value.schema)
    });

    return {
        [utils.capitalizeFirstLetter(model.title)] : {
            "type" : "object",
            "properties": schema,
            ...model.json_schema.required ? {"required" : model.json_schema.required} : "",
        }
    };
};

module.exports = {
    run
};

