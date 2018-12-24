exports.schema =
    {
        "title": "blog_post",
        "type": "object",
        "properties": {
            "_id": { "type": 'string'},
            "user_id": { "type": 'string'},
            "title": { "type": "string" },
            "abstract": { "type": "string" },
            "image_url": { "type": "string" },
            "content": { "type": "string" },
            "tags": { "type": "string" },
            "owner": {"type": "object",
                "properties" : {
                    "_id": {"type": "string"},
                    "email": {"type": "string"},
                    "name": {"type": "string"},
                    "image": {"type": "string"}
                }
            },
            "date_created": {
                "type": "string",
                "format": "date-time"
            },
            "date_revised": {
                "type": "string",
                "format": "date-time"
            },
            "is_published" : { "type" : "boolean" },
            "blog_images" : {
                "type" : "array",
                "items": {
                    "type": "string"
                }
            }
        },
        "required" : ["owner"],
        "additionalProperties" : false
    };

exports.settings = {
    "index" : "genetics-blog_post",
    "doc_type" : "blog_post",
    "user_data" : true,
    "mapping": {
        "aliases": {
            "genetics-blog_post": {}
        },
        "settings": {
            "analysis": {
                "filter"  : {
                    "edge_filter"        : {
                        "type"    : "edge_ngram",
                        "min_gram": 1,
                        "max_gram": 256
                    }
                },
                "analyzer": {
                    "edge_phrase_analyzer"  : {
                        "type"     : "custom",
                        "tokenizer": "keyword",
                        "filter"   : ["lowercase", "edge_filter"]
                    },
                    "term_lowercase": {
                        "type"     : "custom",
                        "tokenizer": "keyword",
                        "filter"   : ["lowercase"]
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
            "blog_post": {
                "properties": {
                    "user_id" : {"type": "keyword"},
                    "title": {
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
                    "abstract": {"type": "text"},
                    "image_url": {"type": "keyword"},
                    "content": {"type": "text"},
                    "tags": {"type": "text"},
                    "owner": {"type": "object",
                        "properties" : {
                            "_id": {"type": "keyword"},
                            "email": {"type": "keyword"},
                            "name": {"type": "text"},
                            "image": {"type": "keyword"}
                        }
                    },
                    "date_created": {"type": "date"},
                    "date_revised": {"type": "date"},
                    "is_published" : { "type" : "boolean" },
                    "blog_images" : { "type" : "keyword"}
                }
            }
        }
    }
};

exports.database = 'elasticsearch';