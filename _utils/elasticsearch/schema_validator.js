let Validator          = require('jsonschema').Validator;
let validator          = new Validator();

let loadModels = (files) => {
    let models = {};

    for (let file in files) {
        let f = files[file];
        if (!f.schema || !f.schema.title) {
            console.error('insufficient data for logical model creation');
        }
        if (models[f.schema.title]) {
            console.error(f.schema.title, ' already exists!');
        }

        models[f.schema.title] = {
            schema: f.schema,
            schema_dependencies : f.schema_dependencies,
            import_initial_data : f.import_initial_data,
            settings: f.settings,
            meta_ui: f.meta_ui
        }
    }

    return models;
};

let validate_strict = (models, model_title, data) => {
    let dependencies = models[model_title].schema_dependencies;
    if (dependencies instanceof Array) {
        for (let i = 0; i < dependencies.length; i++) {
            let d = dependencies[i];
            validator.addSchema(models[d.title].schema, d.id);
        }
    }

    let validation = validator.validate(data, models[model_title].schema);
    if (validation.errors.length) {
        throw new Error(validation);
    }
    if (!models[model_title].settings) {
        throw new Error('model has no physical storage ' + model_title);
    }
};

let validate = (models, model_title, data) => {
    let dependencies = models[model_title].schema_dependencies;
    if (dependencies instanceof Array) {
        for (let i = 0; i < dependencies.length; i++) {
            let d = dependencies[i];
            let d_schema = models[d.title].schema;
            delete d_schema.required;
            validator.addSchema(d_schema, d.id);
        }
    }

    let schema = models[model_title].schema;
    delete schema.required;
    let validation = validator.validate(data, schema);
    if (validation.errors.length) {
        throw new Error(validation);
    }
    if (!models[model_title].settings) {
        throw new Error('model has no physical storage ' + model_title);
    }
};

module.exports = {
    loadModels : loadModels,
    validate : validate,
    validate_strict : validate_strict
};