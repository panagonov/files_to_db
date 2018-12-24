exports.schema =
    {
        "title"     : "mailing_history",
        "type"      : "object",
        "properties": {
            "_id"            : {"type": ["string"]},
            "user_id"        : {"type": "string"},
            "notification_id": {"type": "string"},
            "strategy_name"  : {"enum": ["notify", "newsletter"]},
            "date_created"   : {"type": "string", "format": "date-time"},
            "result"   : {
                "type": "object",
                "additionalProperties" : true
            }
        },
        "additionalProperties" : false
    };

exports.settings = {
    "index" : "bioseek-mailing_history",
    "doc_type" : "mailing_history",
    "user_data" : true,
    "mapping": {
        "aliases": {
            "bioseek-mailing_history": {}
        },
        "settings": {
            "analysis": {
                "filter"  : {
                    "edge_filter"        : {
                        "type"    : "edge_ngram",
                        "min_gram": 1,
                        "max_gram": 256
                    }
                },
                "analyzer": {
                    "edge_phrase_analyzer"  : {
                        "type"     : "custom",
                        "tokenizer": "keyword",
                        "filter"   : ["lowercase", "edge_filter"]
                    },
                    "term_lowercase": {
                        "type"     : "custom",
                        "tokenizer": "keyword",
                        "filter"   : ["lowercase"]
                    },
                    "edge_analyzer" : {
                        "type"     : "custom",
                        "tokenizer": "whitespace",
                        "filter"   : ["lowercase", "edge_filter"]
                    },
                    "lowercase_whitespace": {
                        "type": "custom",
                        "tokenizer": "whitespace",
                        "filter": [ "lowercase" ]
                    }
                }
            }
        },
        "mappings": {
            "mailing_history": {
                "properties": {
                    "user_id"        : {"type": "keyword"},
                    "notification_id": {"type": "keyword"},
                    "strategy_name"  : {"type": "keyword"},
                    "date_created"   : {"type": "date"},
                    "result"         : {"enabled": false}
                }
            }
        }
    }
};

exports.database = 'elasticsearch';