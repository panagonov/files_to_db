exports.schema =
    {
        "title"     : "history_email",
        "type"      : "object",
        "properties": {
            "_id"          : {"type": ["object", "string", "null"]},
            "user_id"      : {"type": "string"},
            "email_id"     : {"type": "string"},
            "strategy_name": {"type": "string"},
            "lang"         : {"type": "string"},
            "data"         : {
                "type"                : "object",
                "additionalProperties": true
            }
        }
    };

exports.settings = {
    "index"    : "bioseek-history_email",
    "doc_type" : "history_email",
    "user_data": true,
    "mapping"  : {
        "aliases" : {
            "bioseek-history_email": {}
        },
        "settings": {},
        "mappings": {
            "history_email": {
                "properties": {
                    "user_id"      : {"type": "keyword"},
                    "email_id"     : {"type": "keyword"},
                    "strategy_name": {"type": "keyword"},
                    "lang"         : {"type": "keyword"},
                    "data"         : {"enabled": false}
                }
            }
        }
    }
};