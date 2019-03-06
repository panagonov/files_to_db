let fs           = require("fs");
let utils        = require("../../_utils/utils.js");
let model_loader = require("./model_loader.js");

let props = {output: `${__dirname}/_auto_generate_output`};

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
    "model_tree"       : {transformer : require("./tools/model_tree.js")                               }
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

let run = () => {

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

    let tools_result = {};
    utils.objEach(tools, (name, {type, transformer}) =>{
        type = type || name;
        tools_result[name] = {type: type || name, value: transformer.run({type, props, temp_result: tools_result})};
        write_result(props.output, type, type, tools_result[name].value)
    })
};

module.exports = run;

run();