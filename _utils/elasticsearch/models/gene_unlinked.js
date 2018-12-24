module.exports = {

    "schema": {
        "title": "gene_unlinked",
        "type": "object",
        "properties": {
            "_id": {
                "type": "string"
            },
            "name": {
                "type": "string"
            },
            "symbol": {
                "type": "string"
            },
            "aliases": {
                "type": "array",
                "items": {
                    "type": "string"
                }
            },
            "type_of_gene" : {
                "type": "string"
            },
            "external_links": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties" : {
                        "key": {"type" : "string"},
                        "id": {"type" : "string"}
                    }
                }
            },
            "rel_version"           : {
                "type" : "number"
            }
        },
        "required": [
            "symbol"
        ],
        "additionalProperties": false
    },

    "settings": {
        "index": "bioseek-unlinked",
        "doc_type": "gene_unlinked",
        "mapping": {
            "aliases": {
                "bioseek-unlinked": {}
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
                "gene_unlinked": {
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
                        "symbol" : {
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
                        "external_links": {"type" : "object",
                            "properties" : {
                                "key" : {"type": "keyword"},
                                "id" : {"type": "keyword"}
                            }
                        },
                        "type_of_gene" : {"type": "keyword"},
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
                        }
                    }
                }
            }
        }
    },

   "database": "elasticsearch"
};