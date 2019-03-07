let fs           = require("fs");
let utils        = require("../../_utils/utils.js");
let model_loader = require("./model_loader.js");

let props = {
    output: `${__dirname}/_auto_generate_output`,
    output_tool_directory: "tools"
};

let transformers = {
    "validation_schema": {transformer : require("./generators/validation_schema.js")                   },
    "elasticsearch"    : {transformer : require("./generators/elasticsearch.js"),     type: "db_schema"},
    "mongodb"          : {transformer : require("./generators/mongodb.js"),           type: "db_schema"},
    "swagger"          : {transformer : require("./generators/swagger.js")                             },
    "source"           : {transformer : require("./generators/source.js")                              },
    "aggregate"        : {transformer : require("./generators/aggregate.js")                           },
    "search_term"      : {transformer : require("./generators/search_term.js")                         },
    "highlight"        : {transformer : require("./generators/highlight.js")                           },
    "model_data"       : {transformer : require("./generators/model_data.js")                          },
};

let tools = {
    "model_tree"        : {transformer : require("./tools/model_tree.js")                              },
    "aggregation_fields": {transformer : require("./tools/aggregation_fields.js")                      },
    "visible_fields"    : {transformer : require("./tools/visible_fields.js")                          },
    "parents"           : {transformer : require("./tools/parents.js")                                 }
};

let write_result = (output, type, file_name, result) =>
{
    if (!result || utils.isEmptyObj(result))
        return;

    if (!fs.existsSync(output))
        fs.mkdirSync(output);

    let output_path = `${output}/${type}`;

    if (!fs.existsSync(output_path))
        fs.mkdirSync(output_path);

    fs.writeFileSync(`${output_path}/${file_name}.json`, JSON.stringify(result), "utf8");
};

let build_model_structure = (props, transformers) =>
{
    let models = model_loader.run();

    utils.objEach(models, (key, model) =>
    {
        let result = {};
        utils.objEach(transformers, (name, {type, transformer}) =>{
            type = type || name;
            result[name] = {type: type || name, value: transformer.run({type, model, props, temp_result: result})};
            write_result(props.output, type, model.title, result[name].value)
        })
    });
};

let build_tools_result = (props, tools) =>
{
    let tools_result = {};
    utils.objEach(tools, (name, {type, transformer}) =>{
        type = type || name;
        tools_result[name] = {type: type || name, value: transformer.run({type, props, temp_result: tools_result})};
        write_result(props.output, props.output_tool_directory, type, tools_result[name].value)
    })
};

let run = () =>
{
    build_model_structure(props, transformers);
    build_tools_result(props, tools);
};

module.exports = run;

run();