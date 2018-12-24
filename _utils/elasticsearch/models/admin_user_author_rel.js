exports.schema =
    {
        "title": "user_author_rel",
        "type": "object",
        "properties": {
            "_id"                   : {"type": "string"},
            "user_id"               : {"type": "string"},
            "author_id"             : {"type": "string"},
            "pubmed_id"             : {"type" : "string"},
            "state"                 : {"enum" : ["processing", "confirmed", "rejected"]},
            "reason"                : {"type" : "integer"},
            "date_created"          : {"type"  : "string", "format": "date-time"},
            "date_revised"          : {"type"  : "string", "format": "date-time"}
        }
    };

exports.settings = {
    "index": "bioseek-user_author_rel",
    "doc_type": "user_author_rel",
    "user_data": true,
    "mapping": {
        "aliases": {
            "bioseek-user_author_rel": {}
        },
        "settings": {
        },
        "mappings": {
            "user_author_rel": {
                "properties": {
                    "user_id"               : {"type" : "keyword"},
                    "author_id"             : {"type" : "keyword"},
                    "pubmed_id"             : {"type" : "keyword"},
                    "state"                 : {"type" : "keyword"},
                    "date_created"          : {"type": "date"},
                    "date_revised"          : {"type": "date"},
                    "reason"                : {"type" : "integer"},
                }
            }
        }
    }
};