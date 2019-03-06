let utils              = require("../../../_utils/utils.js");

let run = ({type, model}) => {

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

    return result
};

module.exports = {
    run
};