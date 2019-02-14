let shop_model = require("./_analysis_resource/shop_model.json");

exports.schema =
{
    "title": "order_line",
    "id" : "/OrderLine",
    "type": "object",
    "properties": {
        "_id"               : {"type": "string"},
        "product_id"        : {"type": "string"},
        "user_id"           : {"type": "string"},
        "distributor_id"    : {"type": "string"},
        "catalog_no"        : {"type": "string"},
        "human_readable_id" : {"type": "string"},
        "type"              : {"type": "string"},
        "name"              : {"type": "string"},
        "price_model"       : shop_model.schema.price_model,
        "amount"            : {"type": "number", "minimum": 1},
        "product_size_index": {"type": "number", "minimum": 0}
    },
    "required" : ["user_id", "product_id", "name", "price_model", "amount"],
    "additionalProperties" : false
};

exports.settings = {
    "index" : "shop_order_line",
    "doc_type" : "order_line",
    "user_data" : true,
    "mapping": {
        "aliases": {
            "shop_order_line": {}
        },
        "settings": {
            "analysis": {
                "analyzer": {
                    "whitelowercase": {
                        "type": "custom",
                        "tokenizer": "whitespace",
                        "filter": ["lowercase"]
                    }
                }
            }
        },
        "mappings": {
            "order_line": {
                "properties": {
                    "product_id"        : {"type": "keyword"},
                    "user_id"           : {"type": "keyword"},
                    "distributor_id"    : {"type": "keyword"},
                    "catalog_no"        : {"type": "keyword"},
                    "human_readable_id" : {"type": "keyword"},
                    "type"              : {"type": "keyword"},
                    "name"              : {"type": "text", "analyzer": "whitelowercase"},
                    "price_model"       : shop_model.settings.price_model,
                    "amount"            : {"type": "long"},
                    "product_size_index": {"type": "integer"}
                }
            }
        }
    }
};

exports.database = 'elasticsearch';