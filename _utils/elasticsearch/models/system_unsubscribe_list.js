
exports.schema =
    {
        "title": "unsubscribe-list",
        "type": "object",
        "properties": {
            "_id" : { "type" : "string" },
            "email": {
                "type": "string",
                "format" : "email"
            }
        },
        //"required" : ["primary_id", "primary_email", "name", "region", "lang"],
        "required" : ["email"], //changed because of the temporary user that does not have all properties
        "additionalProperties" : false
    };

exports.settings = {
    "index" : "system-unsubscribe-list",
    "doc_type" : "unsubscribe-list",
    "mapping": {
        "aliases": {
            "system-unsubscribe-list": {}
        },
        "mappings": {
            "unsubscribe-list": {
                "properties": {
                    "email" : { "type"  : "keyword" }
                }
            }
        }
    }
};

exports.database = 'elasticsearch';