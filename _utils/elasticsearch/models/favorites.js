exports.schema =
{
    "title": "favorites",
    "type": "object",
    "properties": {
        "_id": { "type": 'string'},
        "user_id": { "type": 'string'},
        "type": { "type": 'string'},
        "text": { "type": 'string'},
        "oid": { "type": 'string'},
        "path": { "type": 'string'},
        "date_created": {"type": "string", "format": "date-time"},
    },
    "required" : ["user_id"],
    "additionalProperties" : false
};

exports.settings = {
    "index" : "bioseek-favorites",
    "doc_type" : "favorites",
    "mapping": {
        "aliases": {
            "bioseek-favorites": {}
        },
        "settings": {
            "analysis": {
                "char_filter": {
                    "my_char_filter"  : {
                        "type"       : "pattern_replace",
                        "pattern"    : "([\.|\,|\!|\(|\)|\-|\[|\]])",
                        "replacement": " "
                    },
                    "my_char_filter_2": {
                        "type"       : "pattern_replace",
                        "pattern"    : "(\s+)",
                        "replacement": " "
                    }
                },
                "filter": {
                    "autocomplete_filter": {
                        "type": "edge_ngram",
                        "min_gram": 1,
                        "max_gram": 256,
                        "token_chars": [
                            "letter",
                            "digit"
                        ]
                    }
                },
                "analyzer": {
                    "whitelowercase": {
                        "type": "custom",
                        "tokenizer": "whitespace",
                        "filter": ["lowercase", "autocomplete_filter"],
                        "char_filter": [
                            "my_char_filter", "my_char_filter_2"
                        ]
                    }
                }
            }
        },
        "mappings": {
            "favorites": {
                "properties": {
                    "user_id": {"type": "keyword"},
                    "oid": {"type": "keyword"},
                    "text": {"type": "text", "analyzer": "whitelowercase", "fielddata": true},
                    "type": {"type": "keyword"},
                    "path": {"type": "keyword"},
                    "date_created": {"type": "date"},
                }
            }
        }
    }
};

exports.database = 'elasticsearch';