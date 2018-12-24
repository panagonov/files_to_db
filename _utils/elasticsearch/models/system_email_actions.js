exports.schema =
{
    "title": "email_action",
    "type": "object",
    "properties": {
        "_id" : {
            "type" : "string"
        },
        "user_id" : { "type" : ["string", "null"] },
        "action_name" : {
            "type" : "string"
        },
        "payload": {
            "type" : "object"
        },
        "created": {
            "type": "string",
            "format": "date-time"
        },
        "response": {
            "type" : "array",
            "items" : {
                "type" : "object",
                "properties" : {
                    "date": {
                        "type": "string",
                        "format": "date-time"
                    },
                    "action" : {"enum" :["accepted", "rejected", "unsubscribe", "opened"]},
                    "ip" : { "type" : "string"},
                    "geocode": {
                        "type" : "object",
                        "additionalProperties" : true
                    },
                    "page" : { "type" : "string"},
                    "useragent" : {
                        "type" : "object",
                        "additionalProperties" : true
                    }
                }
            }
        },
        "from" : { "type" : "string" },
        "to" : { "type" : "string" }
    },
    "required" : ["action_name", "payload"],
    "additionalProperties" : false
};

exports.settings = {
    "index" : "system",
    "doc_type" : "email-actions",
    "user_data" : true,
    "mapping": {
        "aliases": {
            "system": {}
        },
        "mappings": {
            "email-actions": {
                "properties": {
                    "user_id" : { "type" : "keyword"},
                    "action_name" : {
                        "type" : "keyword"
                    },
                    "payload": {
                        "type" : "object"
                    },
                    "created": {
                        "type": "date"
                    },
                    "response": {
                        "type" : "object",
                        "properties" : {
                            "date"  : {"type": "date"},
                            "action": {"type": "keyword"},
                            "ip"    : {"type": "keyword"},
                            "geocode": {"type": "object"},
                            "page"  : {"type": "keyword"}
                        }
                    },
                    "from" : { "type" : "keyword" },
                    "to" : { "type" : "keyword" }
                },
                "dynamic_templates": [
                    {
                        "payload_template": {
                            "path_match": "payload.*",
                            "match_mapping_type": "string",
                            "mapping": {
                                "type": "string",
                                "index": "not_analyzed"
                            }
                        }
                    }
                ]
            }
        }
    }
};

exports.database = 'elasticsearch';