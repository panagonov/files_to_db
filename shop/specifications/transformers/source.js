let fs                 = require("fs");
let utils              = require("../../../_utils/utils.js");

let run = (model, props) => {

    let result = {};

    utils.objEach(model.json_schema.properties, (key, val) =>
    {
        if (val.visible_for && val.visible_for.length)
        {
            val.visible_for.forEach(role => {
                result[role] = result[role] || [];
                result[role].push(key)
            })
        }
    });

    fs.writeFileSync(`${props.output}/source/${model.title}.json`, JSON.stringify(result), "utf8");
};

module.exports = {
    run
}