let utils        = require("../../_utils/utils.js");
let model_loader = require("./model_loader.js");

let props = {output: `${__dirname}/output`};

let transformers = {
    "validation_schema": require("./transformers/validation_schema.js"),
    "elasticsearch"    : require("./transformers/elasticsearch.js"),
    "swagger"          : require("./transformers/swagger.js"),
    "source"           : require("./transformers/source.js"),
    "aggregate"        : require("./transformers/aggregate.js")
};

let run = () => {

    let models = model_loader.run();

    utils.objEach(models, (key, value) =>
    {
        utils.objEach(transformers, (name, transformer) =>
            transformer.run(value, props));
    });


};

module.exports = run;

run();