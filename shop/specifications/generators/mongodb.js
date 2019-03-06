/**
 *
 * @param {String} type
 * @param {Object} model
 * @param {String} model.title
 * @param {String} model.database
 * @param {Object} model.json_schema
 * @param {Object} [model.db_settings]
 * @param {String} [model.category]
 * @param {String} [model.schema_dependencies]
 * @param {Boolean} [model.swagger_definition]
 * @returns {Object}
 */
let run = ({type, model}) => {

    if (model.database !== "mongo_db")
        return null;

    let index_name = model.db_settings && model.db_settings.index ? model.db_settings.index  : model.title;
    let result = {
        "collection" : index_name,
        ...model.db_settings && model.db_settings.properties ? {"index" : model.db_settings.properties} : ""
    };

    return result
};

module.exports = {
    run
};

