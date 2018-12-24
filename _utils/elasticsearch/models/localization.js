exports.schema =
    {
        "title"               : "localization",
        "type"                : "object",
        "properties"          : {
            "_id"         : {"type": "string"},
            "user_id"     : {"type": "string"},
            "action"      : {"enum": ["create", "update", "remove"]},
            "path"        : {"type": "string"},
            "value"       : {"type": "string"},
            "lang"        : {"type": "string"},
            "word_count"  : {"type": "number"},
            "char_count"  : {"type": "number"},
            "date_created": {
                "type"  : "string",
                "format": "date-time"
            },
        },
        "additionalProperties": false
    };

exports.settings = {
    "index"   : "genetics-localization",
    "doc_type": "localization",
    "mapping" : {
        "aliases" : {
            "genetics-localization": {}
        },
        "settings": {
            "analysis": {
                "char_filter": {
                    "my_char_filter": {
                        "type"       : "pattern_replace",
                        "pattern"    : "([\.|\,|\!])",
                        "replacement": " "
                    }
                },
                "filter"     : {
                    "autocomplete_filter": {
                        "type"    : "ngram",
                        "min_gram": 2
                    },
                    "edge_filter"        : {
                        "type"    : "edge_ngram",
                        "min_gram": 2,
                        "max_gram": 10
                    }
                },
                "analyzer"   : {
                    "whitelowercase": {
                        "type"     : "custom",
                        "tokenizer": "whitespace",
                        "filter"   : ["lowercase"]
                    },
                    "autocomplete"  : {
                        "type"     : "custom",
                        "tokenizer": "whitespace",
                        "filter"   : ["lowercase", "autocomplete_filter"]
                    },
                    "edge_analyzer" : {
                        "type"     : "custom",
                        "tokenizer": "whitespace",
                        "filter"   : ["lowercase", "edge_filter"]
                    }

                }
            }
        },
        "mappings": {
            "localization": {
                "properties": {
                    "date_created": {"type": "date"},
                    "user_id"     : {"type": "keyword"},
                    "action"      : {"type": "keyword"},
                    "path"        : {"type": "keyword"},
                    "value"       : {"type": "keyword"},
                    "lang"        : {"type": "keyword"},
                    "word_count"  : {"type": "integer", "index": false, "doc_values": true},
                    "char_count"  : {"type": "integer", "index": false, "doc_values": true}
                }
            }
        }
    }
};

exports.database = 'elasticsearch';