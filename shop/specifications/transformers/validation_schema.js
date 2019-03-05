let fs                 = require("fs");
let utils              = require("../../../_utils/utils.js");

let build_validation_schema = props =>
{
    let result = {};
    utils.objEach(props, (key, value) => result[key] = value.schema );

    return result
};

let run = (model, props) => {

    let json_schema = model.json_schema || {};

    let result =  {
        "title": model.title,
        "type": "object",
        "properties" : build_validation_schema(json_schema.properties),
        "additionalProperties" : json_schema.additionalProperties || false,
        ...model.id ? {"id": model.id} : "",
        ...json_schema.required ? { "required": json_schema.required} : ""
    };

    fs.writeFileSync(`${props.output}/validation_schema/${model.title}.json`, JSON.stringify(result), "utf8")
} ;

module.exports = {
    run
};