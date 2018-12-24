exports.schema =
{
    "title": "notification",
    "type": "object",
    "properties": {
        "_id"         : {"type": "string"},
        "uid"         : {"type": "string"},
        "key"         : {"type": "string"},
        "type"        : {"type": "string"},
        "period"      : {"type": {"enum": ["daily", "weekly", "monthly", "disable"]}},
        "search_term" : {"type": "string"},
        "token_stream": {"type": "array", "items": {"type": "array"}},
        "last_notify" : {
            "type"  : "string",
            "format": "date-time"
        },
        "date_created": {
            "type"  : "string",
            "format": "date-time"
        }
    },
    "required" : ["uid"],
    "additionalProperties" : false
};


exports.settings = {
    "index" : "genetics-notification",
    "doc_type" : "notification",
    "user_data" : true,
    "mapping": {
        "aliases": {
            "genetics-notification": {}
        },
        "settings": {
            "analysis": {
                "char_filter": {
                    "my_char_filter"  : {
                        "type"       : "pattern_replace",
                        "pattern"    : "([\.|\,|\!|\(|\)|\-|\[|\]])",
                        "replacement": " "
                    },
                    "my_char_filter_2": {
                        "type"       : "pattern_replace",
                        "pattern"    : "(\s+)",
                        "replacement": " "
                    }
                },
                "filter"  : {
                    "autocomplete_filter": {
                        "type"    : "ngram",
                        "min_gram": 2,
                        "max_gram": 7
                    },
                    "edge_filter"        : {
                        "type"    : "edge_ngram",
                        "min_gram": 2,
                        "max_gram": 40
                    }
                },
                "analyzer": {
                    "autocomplete"  : {
                        "type"     : "custom",
                        "tokenizer": "whitespace",
                        "filter"   : ["lowercase", "autocomplete_filter"]
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
                    }
                }
            }
        },
        "mappings": {
            "notification": {
                "properties": {
                    "uid": {"type": "keyword"},
                    "key": {"type": "keyword"},
                    "type": {"type": "keyword"},
                    "period": {"type": "keyword"},
                    "search_term": {
                        "type": "keyword",
                        "fields": {
                            "raw": {
                                "type": "text",
                                "analyzer": "term_lowercase"
                            },
                            "main": {
                                "type": "text",
                                "analyzer": "autocomplete",
                                "search_analyzer": "standard"
                            },
                            "suggest": {
                                "type": "text",
                                "analyzer" : "edge_analyzer",
                                "search_analyzer": "standard"
                            },
                        }
                    },
                    "token_stream" : {
                        "type": "keyword",
                        "fields": {
                            "raw"    : {
                                "type"    : "text",
                                "analyzer": "term_lowercase"
                            },
                            "main"   : {
                                "type"           : "text",
                                "analyzer"       : "autocomplete",
                                "search_analyzer": "standard"
                            },
                            "suggest": {
                                "type"           : "text",
                                "analyzer"       : "edge_analyzer",
                                "search_analyzer": "standard"
                            }
                        }
                    },

                    "last_notify": {
                        "type": "date",
                        "format" : "strict_date_optional_time"
                    },
                    "date_created": {"type": "date"}
                }
            }
        }
    }
};

exports.database = 'elasticsearch';