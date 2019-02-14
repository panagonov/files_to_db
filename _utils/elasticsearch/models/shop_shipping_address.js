let stopwords          = require("./stopwords.en.json");
let char_filter        = require("./_analysis_resource/char_filter.json");
let analysis_filters   = require("./_analysis_resource/filters.json");
let analysis_analyzers = require("./_analysis_resource/analyzers.json");

exports.schema =
    {
        "title"     : "shipping_address",
        "type"      : "object",
        "properties": {
            "_id"           : {"type": "string"},
            "user_id"       : {"type": "string"},
            "active"        : {"type" : "boolean"},
            "first_name"    : {"type": "string"},
            "last_name"     : {"type": "string"},
            "business_name" : {"type": "string"},
            "street_address": {"type": "string"},
            "city"          : {"type": "string"},
            "postal_code"   : {"type": "string"},
            "country_code"  : {"type": "string"},
            "state"         : {"type": "string"},
            "email"         : {"type": "string"},
            "phone"         : {
                "type": "object",
                "properties" : {
                    "country_code": {"type": "string"},
                    "national_number": {"type": "string"}
                }
            }
        },
        "required" : ["first_name", "last_name", "business_name", "street_address", "city", "country_code", "phone"],
        "additionalProperties": false
    };

exports.settings = {
    "index"   : "shop_shipping_address",
    "doc_type": "shipping_address",
    "mapping" : {
        "aliases" : {
            "shop_shipping_address": {}
        },
        "settings": {
            "analysis": {
                "char_filter": char_filter,
                "filter"     : {
                    "edge_filter"   : analysis_filters.edge_filter,
                    "stop"          : {
                        "type"     : "stop",
                        "stopwords": stopwords
                    },
                    "word_delimeter": analysis_filters.word_delimeter
                },
                "analyzer"   : analysis_analyzers
            }
        },
        "mappings": {
            "shipping_address": {
                "properties": {
                    "user_id"       : {"type": "keyword"},
                    "first_name"    : {"type": "keyword"},
                    "last_name"     : {"type": "keyword"},
                    "business_name" : {"type": "keyword"},
                    "street_address": {"type": "keyword"},
                    "city"          : {"type": "keyword"},
                    "postal_code"   : {"type": "keyword"},
                    "country_code"  : {"type": "keyword"},
                    "state"         : {"type": "keyword"},
                    "phone"         : {
                        "type": "object",
                        "properties" : {
                            "country_code": {"type": "keyword"},
                            "national_number": {"type": "keyword"}
                        }
                    },
                    "email"         : {"type": "keyword"},
                    "active"        : {"type" : "boolean"}
                }
            }
        }
    }
};

exports.database = 'elasticsearch';
exports.category = 'shop_product';