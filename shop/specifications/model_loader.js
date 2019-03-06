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
        if (! value.json_schema)
            return;

        let props = value.json_schema.properties;

        utils.objEach(props, (schema_key, schema_value) =>
            schema_value.schema = replace_ref(schema_value.schema));
    });
};

let merge_with_conflict_check = (from, to) =>
{
    utils.objEach(from, (key, value) => {
        if(to.hasOwnProperty(key))
        {
            if (JSON.stringify(to[key]) !== JSON.stringify(value))
            {
                console.error("Different props into json schema:", key);
                console.error("Parent:", JSON.stringify(to[key]));
                console.error("Child:", JSON.stringify(value));
                process.exit(1);
            }
        }

        to[key] = value
    });
};

let remove_models_with_parents = (models_hash) =>
{
    let result = {};
    utils.objEach(models_hash, (key, value) => {
        if (value.parents && value.parents.length)
           return;
        result[key] = value;
    });

    return result
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
                let schema_props = value.json_schema && value.json_schema.properties ? value.json_schema.properties : {};
                let parent_props = models_hash[model_name].json_schema.properties;
                merge_with_conflict_check(schema_props, parent_props);

                let db_props = value.db_settings && value.db_settings.properties ? value.db_settings.properties : {};
                let parent_db_props = models_hash[model_name].db_settings.properties;
                merge_with_conflict_check(db_props, parent_db_props);
            })
        }
    });

    let only_root_models = remove_models_with_parents(all_models);

    return only_root_models;
};

let check_for_duplicated_model_names = all_models =>
{
    let temp = {};

    utils.objEach(all_models, (key, value) => {
        if (temp.hasOwnProperty(value.title))
        {
            console.error("Duplicate model title:", value.title, " - file name:", key);
            process.exit(1)
        }

        temp[value.title] = 1
    })
};

let get_all_models = () => {
    return directory_reader(`${__dirname}/models/`, "json", true)
}

let run = () => {
    let all_models = get_all_models();
    let refs       = directory_reader(`${__dirname}/refs/`, "json", true);

    check_for_duplicated_model_names(all_models);
    replace_refs_in_models(all_models, refs);

    let merged_models = merge_related_models(all_models);

    return merged_models
};

module.exports = {
    run,
    get_all_models
};