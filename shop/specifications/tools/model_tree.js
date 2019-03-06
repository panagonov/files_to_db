let utils        = require("../../../_utils/utils.js");
let model_loader = require("../model_loader.js");

let find_roots = (obj) =>
{
    let result = {};

    utils.objEach(obj, (key, value) => {
        if (utils.isEmptyObj(value))
        {
            result[key] = value;
        }
    });

    if (utils.isEmptyObj(result))
    {
        console.error("Missing root models!");
        process.exit(1)
    }

    return result
};

let clear_last_in_branch = obj => {
    utils.objEach(obj, (key, value) => {
        if (utils.isEmptyObj(value))
        {
            delete obj[key];
        }
    });
};

let find_child = (roots, hash) =>
{
    utils.objEach(roots, (key, value) => {
        utils.objEach(hash, (hash_key, hash_value) => {
            if (hash_value.hasOwnProperty(key))
            {
                value[hash_key] = {};
                delete hash_value[key]
            }
        });
        clear_last_in_branch(hash);
        if (!utils.isEmptyObj(value) && !utils.isEmptyObj(hash))
            find_child( value, hash)
    });
};

let run = () => {
    let all_models = model_loader.get_all_models();

    let hash = {};

    utils.objEach(all_models, (key, value) => {
        hash[value.title] = {};
        (value.parents || []).forEach(name =>
            hash[value.title][name] = {})
    });


    let roots = find_roots(hash);
    clear_last_in_branch(hash);

    find_child(roots, hash);

    return roots
};

module.exports = {
    run
};
