/**
 *
 * @param {String} type
 * @param {Object} model
 * @param {String} model.title
 * @param {Object} model.db_settings
 * @param {Object} [model.db_settings.search_term_query]

 * @returns {Object|null}
 */
let run = ({type, model}) => {

    let search_term_query = model.db_settings && model.db_settings.search_term_query;

    return search_term_query || null
};

module.exports = {
    run
};

