let utils              = require("../../../_utils/utils.js");

let run = ({type, model}) => {

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

    return result;
};

module.exports = {
    run
};