
exports.schema =
{
    "title": "chat_channel",
    "type": "object",
    "properties": {
        "_id" : { "type" : "string" },
        "title" : { "type" : "string" },
        "type" : { "enum": ["system", "group", "pair_to_pair", "discussion"] },
        "image" : { "type" : "string" },
        "chat_channel" : { "type" : "string" },
        "assigned_to" : {"enum": ["user", "pubmed", "pathway", "gene", "author", "drug", "disease", "enzyme", "anatomy", "process", "organism", "paper", "mind_map", "visual_search", "affiliate", "clinical_trial"]},
        "user_id": {"type": "string"},
        "date": {
            "type": "string",
            "format": "date-time"
        },
        "to" : {
            "type" : "array",
            "items" : {
                "type": "object",
                "properties": {
                    "_id"          : {"type": "string"},
                    "name"         : {"type": "string"},
                    "primary_email": {"type": "string"},
                    "image"        : {"type": "string"},
                    "status"       : { "enum": [ "invited", "invited_by_email", "accepted", "rejected" ]},
                    "old_status"   : { "enum": [ "invited", "invited_by_email", "accepted", "rejected" ]},
                    "invited"      : { "type": "string", "format": "date-time"}
                }
            }
        },
        "role" : { "type" : {"enum" : ["admin", "collaborator"]} },
        "rel_version"             : {"type": "number"}
    },
    required: [
        'chat_channel',
        'user_id'
    ],
    "additionalProperties" : false
};

exports.settings = {
    "index" : "genetics-chat_channel",
    "doc_type" : "chat_channel",
    "user_data" : true,
    "mapping": {
        "aliases": {
            "genetics-chat_channel": {}
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
            "chat_channel": {
                "properties": {
                    "chat_channel": {"type": "keyword"},
                    "title"       : {"type": "text", "analyzer": "whitelowercase"},
                    "type"        : {"type": "keyword"},
                    "assigned_to" : {"type": "keyword"},
                    "user_id"     : {"type": "keyword"},
                    "role"        : {"type": "keyword"},
                    "image"       : {"type": "keyword"},
                    "date"        : {"type": "date"},
                    "to" : {
                        "type"      : "object",
                        "properties": {
                            "_id"          : {"type": "keyword"},
                            "primary_email": {
                                "type"  : "keyword",
                                "fields": {
                                    "search": {
                                        "type"    : "text",
                                        "analyzer": "edge_analyzer"
                                    }
                                }
                            },
                            "name"         : {
                                "type"  : "keyword",
                                "fields": {
                                    "suggest": {
                                        "type"           : "text",
                                        "analyzer"       : "edge_analyzer",
                                        "search_analyzer": "lowercase_whitespace"
                                    }
                                }
                            },
                            "invited"      : {"type": "date"},
                            "image"        : {"type": "keyword"},
                            "status"       : {"type": "keyword"},
                            "old_status"   : {"type": "keyword"}
                        }
                    }
                }
            }
        }
    }
};

exports.database = 'elasticsearch';