exports.schema =
{
    "title": "product_compare",
    "id" : "/ProductCompare",
    "type": "object",
    "properties": {
        "_id": {"type": "string"},
        "user_id" : { "type" : "string" },
        "product_id": { "type" : "string" }
    }
};

exports.settings = {
    "index" : "gentaur-product-compare",
    "doc_type" : "product_compare",
    "mapping": {
        "aliases": {
            "gentaur-product-compare": {}
        },
        "mappings": {
            "product_compare": {
                "properties": {
                    "user_id" : { "type" : "keyword" },
                    "product_id" : { "type" : "keyword" }
                }
            }
        }
    }
};

exports.database = 'elasticsearch';