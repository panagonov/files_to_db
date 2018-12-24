exports.schema =
    {
        "title": "history_count",
        "type": "object",
        "properties": {
            "_id"                   : {"type": ["object", "string", "null"]},
            "item_id"               : {"type": "string"},
            "item_type"             : {"type": "string"},
            "views_count"           : {"type": "number"},
            "posts_count"           : {"type": "number"}
        }
    };


exports.settings = {
    "index": "genetics-history_count",
    "doc_type": "history_count",
    "user_data": true,
    "mapping": {
        "aliases": {
            "genetics-history_count": {}
        },
        "settings": {
        },
        "mappings": {
            "history_count": {
                "properties": {
                    "item_id"               : {"type": "keyword"},
                    "item_type"             : {"type": "keyword"},
                    "views_count"           : {"type": "integer"},
                    "posts_count"           : {"type": "integer"}
                }
            }
        }
    }
};