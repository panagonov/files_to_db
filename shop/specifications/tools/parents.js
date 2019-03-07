let utils        = require("../../../_utils/utils.js");
let model_loader = require("../model_loader.js");

let collect_parents = (model, model_hash) => {
    let result = [model.title].concat(model.parents || []);

    (model.parents || []).forEach(parent_name =>
    {
        result = result.concat(collect_parents(model_hash[parent_name], model_hash));

    });

    return result
};

let run = () => {

    let all_models = model_loader.get_all_models();

    let hash = {};

    utils.objEach(all_models, (key, value) => hash[value.title] = value);

    let result = {};

    utils.objEach(hash, (key, value) => {
        let res = collect_parents(value, hash);
        if (res)
            result[key] = utils.uniq(res).reverse()
    });

    return result
};

module.exports = {
    run
};
