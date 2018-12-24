exports.schema =
    {
        "title": "history_details",
        "type": "object",
        "properties": {
            "_id"                   : {"type": ["object", "string", "null"]},
            "item_id"               : {"type": "string"},
            "item_type"             : {"type": "string"},
            "country_common"        : {"type" : "string"},
            "country"               : {"type" : "string"},
            "region"                : {"type" : "string"},
            "city"                  : {"type" : "string"},
            "latitude"              : {"type" : "number"},
            "longitude"             : {"type" : "number"},
            "user_id"               : {"type" : "string"},
            "date_created"          : {"type": "string", "format": "date-time"}
        }
    };

exports.settings = {
    "index": "genetics-history_details",
    "doc_type": "history_details",
    "user_data": true,
    "mapping": {
        "aliases": {
            "genetics-history_details": {}
        },
        "settings": {
        },
        "mappings": {
            "history_details": {
                "properties": {
                    "item_id"               : {"type" : "keyword"},
                    "item_type"             : {"type" : "keyword"},
                    "country_common"        : {"type" : "keyword"},
                    "country"               : {"type" : "keyword"},
                    "region"                : {"type" : "keyword"},
                    "city"                  : {"type" : "keyword"},
                    "latitude"              : {"type" : "float"},
                    "longitude"             : {"type" : "float"},
                    "user_id"               : {"type" : "keyword"},
                    "date_created"          : {"type": "date"}
                }
            }
        }
    }
};