let run = ({type, model, temp_result}) => {

    let validation_schema = {};
    let db_schema = {};

    Object.keys(temp_result).forEach(name => {
        let {type, value} = temp_result[name];
        if (type === "validation_schema" && value)
            validation_schema = value;
        if (type === "db_schema" && value)
            db_schema = value;
    });

    let result = {
        "schema" : validation_schema,
        "settings" : db_schema,
        "database" : model.database,
        ...model.category ? {"category" : model.category} : "",
        ...model.schema_dependencies ? {"schema_dependencies" : model.schema_dependencies} : ""
    };

    return result

};

module.exports = {
    run
};