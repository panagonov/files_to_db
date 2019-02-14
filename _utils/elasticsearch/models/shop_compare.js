exports.schema =
{
    "title": "compare",
    "id" : "/ProductCompare",
    "type": "object",
    "properties": {
        "_id"         : {"type": "string"},
        "user_id"     : {"type": "string"},
        "product_id"  : {"type": "string"},
        "product_type": {"type": "string"}
    }
};

exports.settings = {
    "index" : "shop_compare",
    "doc_type" : "compare",
    "mapping": {
        "aliases": {
            "shop_compare": {}
        },
        "mappings": {
            "compare": {
                "properties": {
                    "user_id"     : {"type": "keyword"},
                    "product_id"  : {"type": "keyword"},
                    "product_type": {"type": "keyword"}
                }
            }
        }
    }
};

exports.database = 'elasticsearch';