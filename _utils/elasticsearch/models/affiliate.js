module.exports = {

    "schema": {
        "title": "affiliate",
        "type": "object",
        "properties": {
            "_id": {
                "type": "string"
            },
            "name": {
                "type": "string"
            },
            "country": {
                "type": "string"
            },
            "city": {
                "type": "string"
            },
            "alpha_two_code": {
                "type": "string"
            },
            "state-province": {
                "type": "string"
            },
            "state": {
                "type": "string"
            },
            "address": {
                "type": "string"
            },
            "phone": {
                "type": "string"
            },
            "post_code": {
                "type": "string"
            },
            "aliases": {
                "type": "array",
                "items": {
                    "type": "string"
                }
            },
            "web_pages": {
                "type": "array",
                "items" : {
                    "type" : "string"
                }
            },
            "domains": {
                "type": "array",
                "items" : {
                    "type" : "string"
                }
            },
            "logo": {
                "type": "array",
                "items" : {
                    "type" : "string"
                }
            },
            "type" : {
                "type": "string"
            },
            "geocode": {
                "type" : "object",
                "properties" :{
                    "lat" : {"type" : "number"},
                    "lng" : {"type" : "number"}
                }
            },
            "wiki_url" : {
                "type" : "string"
            },
            "popularity" : {
                "type" : "number"
            },
            "verified" : {
                "type" : "boolean"
            },
            "pubmed_relations_count"        : {"type": "number"},
            "author_relations_count"        : {"type": "number"},
            "clinical_trial_relations_count": {"type": "number"},
            "version" : {"type": "integer"}
        },
        "additionalProperties": false
    },

    "settings": {
        "index": "bioseek1-affiliate",
        "doc_type": "affiliate",
        "mapping": {
            "aliases": {
                "bioseek1-affiliate": {}
            },
            "settings": {
                "analysis": {
                    "char_filter": {
                        "my_char_filter": {
                            "type": "mapping",
                            "mappings": [
                                "Α => a",
                                "α => a",
                                "Β => b",
                                "β => b",
                                "Γ => g",
                                "γ => g",
                                "Δ => d",
                                "δ => d",
                                "Ε => e",
                                "ε => e",
                                "Ζ => z",
                                "ζ => z",
                                "Η => e",
                                "η => e",
                                "Θ => t",
                                "θ => t",
                                "Ι => i",
                                "ι => i",
                                "Κ => k",
                                "κ => k",
                                "Λ => l",
                                "λ => l",
                                "Μ => m",
                                "μ => m",
                                "Ν => n",
                                "ν => n",
                                "Ξ => h",
                                "ξ => h",
                                "Ο => o",
                                "ο => o",
                                "Π => p",
                                "π => p",
                                "Ρ => r",
                                "ρ => r",
                                "Σ => s",
                                "σς => s",
                                "Τ => t",
                                "τ => t",
                                "Υ => y",
                                "υ => y",
                                "Φ => f",
                                "φ => f",
                                "Χ => k",
                                "χ => k",
                                "Ψ => ps",
                                "ψ => ps",
                                "Ω => o",
                                "ω => o"
                            ]
                        }
                    },
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
                            "char_filter": ["my_char_filter"],
                            "tokenizer": "keyword",
                            "filter"   : ["lowercase", "edge_filter"]
                        },
                        "term_lowercase": {
                            "type"     : "custom",
                            "char_filter": ["my_char_filter"],
                            "tokenizer": "keyword",
                            "filter"   : ["lowercase"]
                        },
                        "edge_analyzer" : {
                            "type"     : "custom",
                            "char_filter": ["my_char_filter"],
                            "tokenizer": "whitespace",
                            "filter"   : ["lowercase", "edge_filter"]
                        },
                        "lowercase_whitespace": {
                            "type": "custom",
                            "char_filter": ["my_char_filter"],
                            "tokenizer": "whitespace",
                            "filter": [ "lowercase" ]
                        }
                    }
                }
            },
            "mappings": {
                "affiliate": {
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
                        "country": {
                            "type": "keyword",
                            "fields": {
                                "suggest": {
                                    "type": "text",
                                    "analyzer": "lowercase_whitespace",
                                    "search_analyzer": "lowercase_whitespace"
                                }
                            }
                        },
                        "city": {
                            "type": "keyword",
                        },
                        "alpha_two_code": {
                            "type": "keyword",
                        },
                        "state-province": {
                            "type": "keyword",
                        },
                        "web_pages": {
                            "type": "keyword"
                        },
                        "domains": {
                            "type": "keyword"
                        },
                        "state": {
                            "type": "keyword"
                        },
                        "logo": {
                            "type": "keyword"
                        },
                        "type": {
                            "type": "keyword"
                        },
                        "wiki_url": {
                            "type": "keyword"
                        },
                        "address": {
                            "type": "keyword"
                        },
                        "phone": {
                            "type": "keyword"
                        },
                        "post_code": {
                            "type": "keyword"
                        },
                        "aliases": {
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
                                }
                            }
                        },
                        "geocode": {
                            "type" : "object",
                            "properties" :{
                                "lat" : {"type" : "float"},
                                "lng" : {"type" : "float"}
                            }
                        },
                        "popularity" : {
                            "type" : "integer", "index": false, "doc_values": true
                        },
                        "pubmed_relations_count"        : {"type": "integer", "index": false, "doc_values": true},
                        "author_relations_count"        : {"type": "integer", "index": false, "doc_values": true},
                        "clinical_trial_relations_count": {"type": "integer", "index": false, "doc_values": true},
                        "verified" : {
                            "type" : "boolean"
                        }
                    }
                }
            }
        }
    },

    "database": "elasticsearch"
};