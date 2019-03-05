let utils            = require("../../_utils/utils.js");
let directory_reader = require("../../_utils/directory_reader.js");

let replace_refs_in_models = (models, refs) =>
{
    let refs_hash = {};

    utils.objEach(refs, (key, value) => refs_hash[value.$ref] = value.schema );

    let replace_ref = (value) =>
    {
        if (value.$ref)
            return replace_ref(refs_hash[value.$ref]);

        switch (value.type)
        {
            case "object" :
                let result = {};
                utils.objEach(value.properties, (schema_key, schema_value) =>
                    result[schema_key] = replace_ref(schema_value));

                return {"type" : "object", "properties" : result};

            case "array" :
                return {"type" : "array", "items" : replace_ref(value.items)};
            default:
                return value
        }

    };

    utils.objEach(models, (key, value) =>
    {
        let props = value.json_schema.properties;

        utils.objEach(props, (schema_key, schema_value) =>
            schema_value.schema = replace_ref(schema_value.schema));
    });
};

let merge_related_models = (all_models) => {

    let models_hash = {};
    utils.objEach(all_models, (key, value) => models_hash[value.title] = value);

    let find_first_parent_name = (model_value) => {
        if (!model_value.parents || !model_value.parents.length)
            return [model_value.title];

        return model_value.parents.reduce((res, parent_name) => {

            if (!models_hash[parent_name])
            {
                console.error("Missing parent model:", parent_name);
                return process.exit(1)
            }

            res = res.concat(find_first_parent_name(models_hash[parent_name]));
            return res;
        }, [])
    };


    utils.objEach(all_models, (key, value) =>
    {
        let first_parents = utils.uniq(find_first_parent_name(value)).filter(name => name !== value.title);
        if (first_parents.length)
        {
            first_parents.forEach(model_name => {
                let schema_props = value.json_schema && value.json_schema.properties ?   value.json_schema.properties : {};
                models_hash[model_name].json_schema.properties = Object.assign(models_hash[model_name].json_schema.properties, schema_props);

                let db_props = value.db_settings && value.db_settings.properties ?   value.db_settings.properties : {}
                models_hash[model_name].db_settings.properties = Object.assign(models_hash[model_name].db_settings.properties, db_props)
            })
        }
    });

    utils.objEach(models_hash, (key, value) => {
        if (value.parents && value.parents.length)
            delete models_hash[key]
    });

    return models_hash;
};

let run = () => {
    let all_models = directory_reader(`${__dirname}/models/`, "json", true);
    let refs       = directory_reader(`${__dirname}/refs/`, "json", true);

    replace_refs_in_models(all_models, refs);

    let merged_models = merge_related_models(all_models);

    return merged_models
};

module.exports = {
    run
};