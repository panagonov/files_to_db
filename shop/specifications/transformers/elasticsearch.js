let fs                 = require("fs");
let utils              = require("../../../_utils/utils.js");
let stopwords          = require("../../../common-components/search-engine-3/domains/genetics/cli-tools/stopwords.en.json");
let char_filter        = require("../_analysis_resource/char_filter.json");
let analysis_filters   = require("../_analysis_resource/filters.json");
let analysis_analyzers = require("../_analysis_resource/analyzers.json");

let build_index_mapping =  (value, custom_schema_data) =>
{
    let combine_settings_data = (props_data, custom_schema_data) =>
        Object.assign(props_data, custom_schema_data);


        if (value.enums)
            return combine_settings_data({"type": "keyword"}, custom_schema_data);

        switch (value.type)
        {
            case "string":
                if (value.format === "date-time") {
                    return combine_settings_data({"type": "date"}, custom_schema_data);
                }
                return combine_settings_data({"type": "keyword"}, custom_schema_data);
            case "number":
                return combine_settings_data({"type": "integer"}, custom_schema_data);
            case "array":
                return build_index_mapping(value.items, custom_schema_data);
            case "object":
                let result = {};
                utils.objEach(value.properties, (schema_key, schema_value) =>
                    result[schema_key] = build_index_mapping(schema_value, (custom_schema_data || {})[schema_value]));
                return {
                    "type" : "object",
                    "properties" : result
                };
            default:
                return combine_settings_data({"type": value.type}, custom_schema_data);
        }
};

let build_settings = model =>
{
    let index_name = model.db_settings && model.db_settings.index ? model.db_settings.index  : `bioseek-${value.title}`;

    let mappings = {};

    utils.objEach(model.json_schema.properties, (key, val) =>
    {
        mappings[key] = build_index_mapping(val.schema, (model.db_settings.properties || {})[key]);
    });

    return {
        "index": index_name,
        "doc_type": model.title,
        "mapping": {
            "aliases": {
                [index_name] : {}}
        },
        "settings": {
            "analysis": {
                "char_filter": char_filter,
                "filter"     : {
                    "edge_filter"   : analysis_filters.edge_filter,
                    "stop"          : {
                        "type"     : "stop",
                        "stopwords": stopwords
                    },
                    "word_delimeter": analysis_filters.word_delimeter
                },
                "analyzer"   : analysis_analyzers
            }
        },
        "mappings": mappings
    }
};

/**
 *
 * @param {Object} model
 * @param {String} model.title
 * @param {String} model.database
 * @param {String} [model.category]
 * @param {String} [model.schema_dependencies]
 * @param {Object} model.json_schema
 * @param {Boolean} [model.swagger_definition]
 * @param {Object} props
 * @param {String} props.output - output directory
 * @returns {null}
 */
let run = (model, props) => {

    if (model.database !== "elasticsearch")
        return null;

    let result = build_settings(model);

    fs.writeFileSync(`${props.output}/db_schema/${model.title}.json`, JSON.stringify(result), "utf8")
};

module.exports = {
    run
};

