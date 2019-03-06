let utils        = require("../../../_utils/utils.js");
let model_loader = require("../model_loader.js");

let collect_fields = (model, model_hash) => {
    let result = {};

    if (model.json_schema && model.json_schema.properties)
    {
        utils.objEach(model.json_schema.properties, (pr_key, pr_value) => {
            if (pr_value.visible_for)
            {
                if (typeof pr_value.visible_for === "string")
                    pr_value.visible_for = [pr_value.visible_for];

                pr_value.visible_for.forEach(role_name => {
                    result[role_name] = result[role_name] || [];
                    result[role_name].push(pr_key)
                })
            }
        });
    }

    (model.parents || []).forEach(parent_name =>
    {
        let res = collect_fields(model_hash[parent_name], model_hash);
        if (res) {
            utils.objEach(res, (key, value) => {
                result[key] = utils.uniq((result[key] || []).concat(value))
            });
        }
    });

    return utils.isEmptyObj(result) ? null : result
};

let run = () => {

    let all_models = model_loader.get_all_models();

    let hash = {};

    utils.objEach(all_models, (key, value) => hash[value.title] = value);

    let result = {};

    utils.objEach(hash, (key, value) => {
        let res = collect_fields(value, hash);
        if (res)
            result[key] = res
    });

    return result
};

module.exports = {
    run
};
