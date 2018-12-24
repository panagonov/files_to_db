exports.schema =
    {
        "title": "author_email_verification",
        "type": "object",
        "properties": {
            "_id"           : {"type": "string"},
            "user_id"       : {"type": "string"},
            "author_id"     : {"type": "string"},
            "original_email": {"type": "string"},
            "email"         : {"type": "string"},
            "email_data_id" : {"type": "string"},
            "state"         : {"enum": ["processing", "confirmed", "rejected"]},
            "reason"        : {"type": "integer"},
            "date_created"  : {"type": "string", "format": "date-time"},
            "date_revised"  : {"type": "string", "format": "date-time"}
        }
    };

exports.settings = {
    "index": "bioseek-author_email_verification",
    "doc_type": "author_email_verification",
    "user_data": true,
    "mapping": {
        "aliases": {
            "bioseek-author_email_verification": {}
        },
        "settings": {
        },
        "mappings": {
            "author_email_verification": {
                "properties": {
                    "user_id"       : {"type": "keyword"},
                    "author_id"     : {"type": "keyword"},
                    "email"         : {"type": "keyword"},
                    "original_email": {"type": "string"},
                    "email_data_id" : {"type": "keyword"},
                    "state"         : {"type": "keyword"},
                    "reason"        : {"type": "integer"},
                    "date_created"  : {"type": "date"},
                    "date_revised"  : {"type": "date"}
                }
            }
        }
    }
};