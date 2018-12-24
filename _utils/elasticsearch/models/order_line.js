exports.schema =
{
    "title": "order_line",
    "id" : "/OrderLine",
    "type": "object",
    "properties": {
        "_id" : { "type" : "string" },
        "product_id" : { "type" : "string" },
        "user_id" : { "type" : "string" },
        "catalog_no" : { "type" : "string" },
        "name": { "type": "string" },
        "price": { "type" : "number", "minimum" : 0 },
        "amount" : { "type" : "number", "minimum" : 1 },
        "size" : { "type" : "string"}
    },
    "required" : ["user_id", "product_id", "name", "price", "amount"],
    "additionalProperties" : false
};

exports.settings = {
    "index" : "gentaur-basket",
    "doc_type" : "order-line",
    "user_data" : true,
    "mapping": {
        "aliases": {
            "gentaur-basket": {}
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
            "order-line": {
                "properties": {
                    "product_id" : {"type": "keyword"},
                    "user_id": {"type": "keyword"},
                    "catalog_no" : { "type" : "keyword" },
                    "name": { "type": "text", "analyzer": "whitelowercase" },
                    "price": { "type" : "long"},
                    "amount" : { "type" : "long"},
                    "size" : { "type" : "keyword"}
                }
            }
        }
    }
};

exports.database = 'elasticsearch';