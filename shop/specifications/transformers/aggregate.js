let fs                 = require("fs");
let utils              = require("../../../_utils/utils.js");

let run = (model, props) => {

    let result = {};

    utils.objEach(model.json_schema.properties, (key, val) =>
    {
        if (val.aggregate)
        {
            result[key] = {
                "terms" : {
                    "field" : key,
                    "size" : 10000
                }
            }
        }
    });

    fs.writeFileSync(`${props.output}/aggregate/${model.title}.json`, JSON.stringify(result), "utf8");
};

module.exports = {
    run
}