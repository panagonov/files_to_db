exports.schema =
{
    "title": "settings",
    "type": "object",
    "properties": {
        "_id" : { "type" : "string" },
        "user_id" : { "type" : "string" },
        "billing_address": {
            "type" : "object",
            "$ref": "/AddressLine"
        },
        "shipping_address": {
            "type" : "array",
            "items" : {
                "type" : "object",
                "$ref": "/AddressLine"
            }
        }

    },
    "required" : ["_id", "user_id"],
    "additionalProperties" : false
};

exports.schema_dependencies = [
    { id: '/AddressLine', title : 'address_line' }
];

exports.settings = {
    "index" : "gentaur-settings",
    "doc_type" : "settings",
    "user_data" : true,
    "mapping": {
        "aliases": {
            "gentaur-settings": {}
        },
        "mappings": {
            "settings": {
                "properties": {
                    "user_id" : { "type" : "keyword"},
                    "billing_address": {
                        "type" : "object",
                        "properties": {
                            "first_name" : {"type": "text"},
                            "last_name"  : {"type": "text"},
                            "company"    : {"type": "text"},
                            "address"    : {"type": "text"},
                            "city"       : {"type": "text"},
                            "postal_code": {"type": "text"},
                            "country"    : {"type": "text"},
                            "state"      : {"type": "text"},
                            "phone"      : {"type": "text"}
                        }
                    },
                    "shipping_address": {
                        "type" : "object",
                        "properties": {
                            "first_name" : {"type": "text"},
                            "last_name"  : {"type": "text"},
                            "company"    : {"type": "text"},
                            "address"    : {"type": "text"},
                            "city"       : {"type": "text"},
                            "postal_code": {"type": "text"},
                            "country"    : {"type": "text"},
                            "state"      : {"type": "text"},
                            "phone"      : {"type": "text"}
                        }
                    }
                }
            }
        }
    }
};

exports.meta_ui = {
    "_id" : {
        "type"        : "text",
        "display"     : false
    },
    "billing_address" : {
        "type"        : "object",
        "title"       : true,
        "row_on_every": true,
        "properties"  : {
            "first_name" : {"type": "text", "required": true},
            "last_name"  : {"type": "text", "required": true},
            "company"    : {"type": "text", "required": true},
            "address"    : {"type": "text", "required": true},
            "city"       : {"type": "text", "required": true},
            "postal_code": {"type": "text", "required": true},
            "country"    : {"type": "text", "required": true},
            "state"      : {"type": "text", "required": true},
            "phone"      : {"type": "text", "required": true}
        }
    },
    "shipping_address": {
        "type"     : "array",
        "title"    : true,
        "min_loops": 1,
        "title_controls" : {
            "add_shipping_address": {"type": "button"}
        },
        "items": {
            "type"        : "object",
            "same_row"    : false,
            "properties"  : {
                "first_name" : {"type": "text", "required": true},
                "last_name"  : {"type": "text", "required": true},
                "company"    : {"type": "text", "required": true},
                "address"    : {"type": "text", "required": true},
                "city"       : {"type": "text", "required": true},
                "postal_code": {"type": "text", "required": true},
                "country"    : {"type": "text", "required": true},
                "state"      : {"type": "text", "required": true},
                "phone"      : {"type": "text", "required": true}
            }
        }
    },
};

exports.database = 'elasticsearch';