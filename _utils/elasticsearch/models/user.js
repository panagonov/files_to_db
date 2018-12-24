
exports.schema =
{
    "title": "user",
    "type": "object",
    "properties": {
        "_id" : { "type" : "string" },
        "is_temporary" : { "type" : "boolean" },
        "is_bot" : { "type" : "boolean" },
        "author_id" : { "type" : "string" },
        "bot_name" : { "type" : "string" },
        "ip_address" : { "type" : "string" },
        "data_usage" : { "type" : "string" },
        "data_usage_analytics" : { "type" : "string" },
        "data_usage_insights" : { "type" : "string" },
        "data_usage_articles" : { "type" : "string" },
        "data_usage_emails" : { "type" : "string" },
        "data_usage_shop" : { "type" : "string" },
        "data_share" : { "type" : "string" },
        "data_last_usage_email" : {
            "type": "string",
            "format": "date-time"
        },
        "history_searches" : { "type" : "string" },
        "history_bio_objects" : { "type" : "string" },
        "history_chat" : { "type" : "string" },
        "visibility_name" : { "type" : "string" },
        "visibility_email" : { "type" : "string" },
        "visibility_phone" : { "type" : "string" },
        "facebook_email": {
            "type": "string",
            "format" : "email"
        },
        "facebook_first_name": {
            "type": "string"
        },
        "facebook_gender": {
            "type" : { "enum": ["female", "male"] }
        },
        "facebook_id": {
            "type": "string"
        },
        "facebook_image_url": {
            "type": "string",
            "format" : "uri"
        },
        "facebook_last_name": {
            "type": "string"
        },
        "facebook_name": {
            "type": "string"
        },
        "facebook_token_for_business": {
            "type": "string"
        },
        "google_displayName": {
            "type": "string"
        },
        "google_emails": {
            "type" : "array",
            "items": [
                {
                    "type": "object",
                    "properties" : {
                        "value" : {
                            "type" : "string",
                            "format" : "email"
                        },
                        "type" : {
                            "type" : "string"
                        }
                    }
                }
            ]
        },
        "google_email": { "type" : "string" },
        "google_gender": {
            "type" : { "enum": ["female", "male"] }
        },
        "google_id": {
            "type": "string"
        },
        "google_image_url": {
            "type": "string"
        },
        "google_name": {
            "type" : "object",
            "properties": {
                "familyName": {
                    "type": "string"
                },
                "givenName": {
                    "type": "string"
                }
            }
        },
        "google_first_name" : { "type" : "string" },
        "google_last_name" : { "type" : "string" },
        "linkedin_image_url": {
            "type": "string",
            "format" : "uri"
        },
        "linkedin_emailAddress": { "type": "string"},
        "linkedin_firstName": { "type": "string"},
        "linkedin_lastName": { "type": "string"},
        "linkedin_id": { "type": "string"},
        "linkedin_formattedName": { "type": "string"},
        "linkedin_headline": { "type": "string"},
        "image": {
            "type": ["string", "null"]
        },
        "background_image": {
            "type": ["string", "null"]
        },
        "lang": {
            "type": "string"
        },
        "region": {
            "type": "string"
        },
        "created": {
            "type": "string",
            "format": "date-time"
        },
        "deleted": {
            "anyOf" : [
                {
                    "type" : "string",
                    "format" : "date-time"
                },
                {
                    "type": "null"
                }
            ]
        },
        "downloaded": {
            "anyOf" : [
                {
                    "type" : "string",
                    "format" : "date-time"
                },
                {
                    "type": "null"
                }
            ]
        },
        "name": {
            "type": "string"
        },
        "first_name": {"type": "string"},
        "middle_name": {"type": "string"},
        "last_name": {"type": "string"},
        "prefix": {"type": "string"},
        "suffix": {"type": "string"},
        "former_name" : {"type" : "string"},
        "title" : {"type" : "string"},
        "phone" : {"type" : "string"},
        "primary_email": {
            "type": "string",
            "format" : "email"
        },
        "primary_id": {
            "type": "string"
        },
        "active_login": {
            "type": "integer"
        },
        "standard_email" : {"type" : "string"},
        "standard_password" : {"type" : "string"},
        "standard_sha_noise" : {"type" : "string"},
        "role" : {"type": {"enum": ["admin", "user", "translator"]}},
        "unsubscribe" : {
            "type" : "boolean"
        },
        "payment_status": {
            "enum": ["free", "standard", "full"]
        },
        "used_storage" : {"type" : "number"},
        "trace" : { "type"  : "string" },
        "chat_channel": { "type"  : "string" },
        "useragent" : {
            "type": "object",
            "properties": {
                "browser" : { "type"  : "string" },
                "os" : { "type"  : "string" },
                "platform" : { "type"  : "string" },
                "isMobile" : { "type"  : "boolean" },
            }
        },
        "geocode" : {
            "type": "object",
            "properties": {
                "country" : { "type"  : "string" },
                "city" : { "type"  : "string" },
                "ll" : {
                    "type"  : "array",
                    "items" : {"type": "float"}
                }
            }
        },
        "companies": {
            "type" : "array",
            "items": [
                {
                    "type": "object",
                    "properties" : {
                        "name" : { "type" : "string" },
                        "position" : { "type" : "string" },
                        "email" : {
                            "anyOf" : [
                                {
                                    "type" : "string",
                                    "format" : "email"
                                },
                                {
                                    "type": "string",
                                    "maxLength": 0
                                }
                            ]
                        },
                        "phone" : {
                            "type" : "string"
                        }
                    }
                }
            ]
        },
        "rel_version"             : {"type": "integer"}
    },
    //"required" : ["primary_id", "primary_email", "name", "region", "lang"],
    "required" : ["region", "lang"], //changed because of the temporary user that does not have all properties
    "additionalProperties" : false
};

exports.settings = {
    "index" : "genetics-user",
    "doc_type" : "user",
    "user_data" : true,
    "mapping": {
        "aliases": {
            "genetics-user": {}
        },
        "settings": {
            "analysis": {
                "char_filter": {
                    "my_char_filter": {
                        "type"       : "pattern_replace",
                        "pattern"    : "([\.|\,|\!])",
                        "replacement": " "
                    }
                },
                "filter": {
                    "autocomplete_filter": {
                        "type"    : "ngram",
                        "min_gram": 2,
                        "max_gram": 7
                    },
                    "edge_filter"        : {
                        "type"    : "edge_ngram",
                        "min_gram": 1,
                        "max_gram": 256
                    }
                },
                "analyzer": {
                    "whitelowercase": {
                        "type": "custom",
                        "tokenizer": "whitespace",
                        "filter": ["lowercase"]
                    },
                    "autocomplete": {
                        "type": "custom",
                        "tokenizer": "whitespace",
                        "filter": ["lowercase", "autocomplete_filter"]
                    },
                    "edge_analyzer" : {
                        "type"     : "custom",
                        "tokenizer": "whitespace",
                        "filter"   : ["lowercase", "edge_filter"]
                    },
                    "lowercase_whitespace": {
                        "type": "custom",
                        "tokenizer": "whitespace",
                        "filter": [ "lowercase" ]
                    }
                }
            }
        },
        "mappings": {
            "user": {
                "properties": {
                    "is_temporary" : { "type" : "boolean" },
                    "is_bot" : { "type" : "boolean" },
                    "bot_name" : { "type" : "keyword" },
                    "ip_address" : { "type" : "keyword" },
                    "author_id" : { "type" : "keyword" },
                    "data_usage" : { "type" : "keyword" },
                    "data_usage_analytics" : { "type" : "keyword" },
                    "data_usage_insights" : { "type" : "keyword" },
                    "data_usage_articles" : { "type" : "keyword" },
                    "data_usage_emails" : { "type" : "keyword" },
                    "data_usage_shop" : { "type" : "keyword" },
                    "data_share" : { "type" : "keyword" },
                    "history_searches" : { "type" : "keyword" },
                    "history_bio_objects" : { "type" : "keyword" },
                    "history_chat" : { "type" : "keyword" },
                    "visibility_name" : { "type" : "keyword" },
                    "visibility_email" : { "type" : "keyword" },
                    "visibility_phone" : { "type" : "keyword" },
                    "primary_id": {"type": "text", "analyzer": "whitelowercase"},
                    "primary_email": {
                        "type": "keyword",
                        "fields" : {
                            "search" :{
                                "type" : "text",
                                "analyzer" : "edge_analyzer"
                            }
                        }
                    },
                    "name": {
                        "type": "keyword",
                        "store" : true, // todo: check results
                        "fields": {
                            "suggest": {
                                "type": "text",
                                "analyzer" : "edge_analyzer",
                                "search_analyzer": "lowercase_whitespace"
                            }
                        }
                    },
                    "first_name": {"type": "keyword", "copy_to": "name"},
                    "middle_name": {"type": "keyword", "copy_to": "name"},
                    "last_name": {"type": "keyword", "copy_to": "name"},
                    "prefix": {"type": "keyword"},
                    "suffix": {"type": "keyword"},
                    "former_name" : {"type" : "keyword"},
                    "title" : {"type" : "keyword"},
                    "phone" : {"type" : "text"},
                    "role": {"type": "keyword"},
                    "region": {"type": "text", "analyzer": "whitelowercase"},
                    "lang": {"type": "text", "analyzer": "whitelowercase"},
                    "image": {"type": "keyword"},
                    "background_image": {"type": "keyword"},
                    "created": {"type": "date"},
                    "deleted": {"type": "date"},
                    "downloaded": {"type": "date"},
                    "facebook_email": { "type": "keyword"},
                    "facebook_first_name": { "type": "keyword"},
                    "facebook_gender": { "type": "keyword"},
                    "facebook_id": { "type": "keyword"},
                    "facebook_image_url": { "type": "keyword"},
                    "facebook_last_name": { "type": "keyword"},
                    "facebook_name": { "type": "keyword"},
                    "facebook_token_for_business": { "type": "keyword" },
                    "google_displayName": { "type": "keyword"},
                    "google_gender": { "type": "keyword"},
                    "google_id": { "type": "keyword"},
                    "google_image_url": { "type": "keyword"},
                    "google_name": { "type": "keyword"},
                    "google_emails": { "type": "keyword"},
                    "google_email": { "type": "keyword"},
                    "google_first_name" : { "type" : "keyword" },
                    "google_last_name" : { "type" : "keyword" },
                    "linkedin_emailAddress": { "type": "keyword"},
                    "linkedin_image_url": { "type": "keyword"},
                    "linkedin_firstName": { "type": "keyword"},
                    "linkedin_lastName": { "type": "keyword"},
                    "linkedin_id": { "type": "keyword"},
                    "linkedin_formattedName": { "type": "keyword"},
                    "linkedin_headline": { "type": "keyword"},
                    "standard_email": { "type": "keyword"},
                    "standard_password": { "type": "keyword"},
                    "standard_sha_noise" : { "type": "keyword"},
                    "unsubscribe" : { "type" : "boolean" },
                    "payment_status": { "type": "keyword"},
                    "used_storage" : {"type" : "integer","index": false},
                    "trace" : { "type"  : "keyword" },
                    "chat_channel" : { "type"  : "keyword" },
                    "useragent" : {
                        "type": "object",
                        "properties": {
                            "browser" : { "type"  : "keyword" },
                            "os" : { "type"  : "keyword" },
                            "platform" : { "type"  : "keyword" },
                            "isMobile" : { "type"  : "boolean" },
                        }
                    },
                    "geocode" : {
                        "type": "object",
                        "properties": {
                            "country" : { "type"  : "keyword" },
                            "city" : { "type"  : "keyword" },
                            "ll" : { "type"  : "float" }
                        }
                    },
                    "companies" : { "type"  : "keyword" }
                }
            }
        }
    }
};

exports.database = 'elasticsearch';