
exports.schema =
{
    "title": "files",
    "type": "object",
    "properties": {
        "_id"         : {"type": "string"},
        "key"         : {"type": "string"},
        "name"        : {"type": "string"},
        "preview"     : {"type": "boolean"},
        "type"        : {"type": "string"},
        "group"       : {"type": "string"},
        "user_id"     : {"type": "string"},
        "size"        : {"type": "number"},
        "date_created": {
            "type"  : "string",
            "format": "date-time"
        }
    },
    required: [
        'key',
        'user_id'
    ],
    "additionalProperties" : false
};

exports.settings = {
    "index" : "genetics-files",
    "doc_type" : "files",
    "user_data" : true,
    "mapping": {
        "aliases": {
            "genetics-files": {}
        },
        "settings": {
            "analysis": {
                "filter"  : {
                    "edge_filter": {
                        "type"    : "edge_ngram",
                        "min_gram": 1,
                        "max_gram": 256
                    }
                },
                "analyzer": {
                    "edge_phrase_analyzer": {
                        "type"     : "custom",
                        "tokenizer": "keyword",
                        "filter"   : ["lowercase", "edge_filter"]
                    },
                    "term_lowercase"      : {
                        "type"     : "custom",
                        "tokenizer": "keyword",
                        "filter"   : ["lowercase"]
                    },
                    "edge_analyzer"       : {
                        "type"     : "custom",
                        "tokenizer": "whitespace",
                        "filter"   : ["lowercase", "edge_filter"]
                    },
                    "lowercase_whitespace": {
                        "type"     : "custom",
                        "tokenizer": "whitespace",
                        "filter"   : ["lowercase"]
                    }
                }
            }
        },
        "mappings": {
            "files": {
                "properties": {
                    "name": {
                        "type": "keyword",
                        "fields": {
                            "raw": {
                                "type": "text",
                                "analyzer": "term_lowercase"
                            },
                            "main": {
                                "type": "text",
                                "analyzer": "edge_phrase_analyzer",
                                "search_analyzer" : "term_lowercase"
                            },
                            "suggest": {
                                "type": "text",
                                "analyzer" : "edge_analyzer",
                                "search_analyzer": "lowercase_whitespace"
                            }
                        }
                    },
                    "key"         : {"type": "keyword"},
                    "preview"     : {"type": "keyword"},
                    "group"       : {"type": "keyword"},
                    "type"        : {"type": "keyword"},
                    "user_id"     : {"type": "keyword"},
                    "role"        : {"type": "keyword"},
                    "date_created": {"type": "date"},
                    "size"        : {"type": "integer", "index": false, "doc_values": true},
                }
            }
        }
    }
};

exports.database = 'elasticsearch';