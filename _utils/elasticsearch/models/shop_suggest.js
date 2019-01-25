let char_filter        = require("./_analysis_resource/char_filter.json");
let analysis_filters   = require("./_analysis_resource/filters.json");
let analysis_analyzers = require("./_analysis_resource/analyzers.json");

module.exports = {

    "schema": {
        "title"               : "shop_suggest",
        "type"                : "object",
        "properties"          : {
            "_id"    : {
                "type": "string"
            },
            "name"   : {
                "type": "string"
            },
            "category"   : {
                "type" : "array",
                "items": {
                    "type": "string"
                }
            },
            "aliases": {
                "type" : "array",
                "items": {
                    "type": "string"
                }
            },
            "type"   : {
                "type": "string"
            }
        },
        "additionalProperties": false
    },

    "settings": {
        "index"   : "shop-suggest",
        "doc_type": "shop_suggest",
        "mapping" : {
            "aliases" : {
                "shop-suggest": {}
            },
            "settings": {
                "analysis": {
                    "char_filter": char_filter,
                    "filter"     : analysis_filters,
                    "analyzer"   : analysis_analyzers
                }
            },
            "mappings": {
                "shop_suggest": {
                    "properties": {
                        "name"   : {
                            "type"  : "keyword",
                            "fields": {
                                "raw"    : {
                                    "type"    : "text",
                                    "analyzer": "term_lowercase"
                                },
                                "main"   : {
                                    "type"           : "text",
                                    "analyzer"       : "edge_phrase_analyzer",
                                    "search_analyzer": "term_lowercase"
                                },
                                "suggest": {
                                    "type"           : "text",
                                    "analyzer"       : "edge_analyzer",
                                    "search_analyzer": "lowercase_whitespace"
                                }
                            }
                        },
                        "aliases": {
                            "type"  : "keyword",
                            "fields": {
                                "raw" : {
                                    "type"    : "text",
                                    "analyzer": "term_lowercase"
                                },
                                "main": {
                                    "type"           : "text",
                                    "analyzer"       : "edge_phrase_analyzer",
                                    "search_analyzer": "term_lowercase"
                                }
                            }
                        },
                        "type"       : {"type": "keyword"},
                        "category"   : {"type": "keyword"}
                    }
                }
            }
        }
    },

    "database": "elasticsearch"
};