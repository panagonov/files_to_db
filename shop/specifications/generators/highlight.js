let utils              = require("../../../_utils/utils.js");

let extract_highlight_from_search_term = (search_term_query) =>
{
    let get_a = (value) =>
    {
        let result =[];
        if (value instanceof Array)
        {
            value.forEach(val => result = result.concat(get_a(val)))
        }
        else if(value instanceof Object)
        {
            if (value.hasOwnProperty("match"))
            {
                result = result.concat(Object.keys(value.match));
            }
            else if (value.hasOwnProperty("term"))
            {
                result = result.concat(Object.keys(value.term));
            }
            else
            {
                utils.objEach(value, (key, val) => result = result.concat(get_a(val)))
            }
        }

        return result
    };

    return get_a(search_term_query)
};

/**
 *
 * @param {String} type
 * @param {Object} model
 * @param {String} model.title
 * @param {Object} model.db_settings
 * @param {Array} [model.highlight]
 * @returns {Object|null}
 */
let run = ({type, model}) => {

    // let highlight_fields = model.db_settings && model.db_settings.highlight && model.db_settings.highlight.length ? model.db_settings.highlight : null;
    //
    // if (!highlight_fields)
    //     return null;
    //
    // let highlight = highlight_fields.reduce((res,name) => {
    //     res[name] = {};
    //     return res
    // }, {});

    let search_term_query = model.db_settings && model.db_settings.search_term_query;

    if (!search_term_query)
        return null;

    let highlight = extract_highlight_from_search_term(search_term_query);

    let result = {
        "highlight" : {
            "number_of_fragments" : 0,
            "fields" : highlight
        }
    };

    return result
};

module.exports = {
    run
};

