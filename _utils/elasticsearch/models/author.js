module.exports = {

    "schema": {
        "title": "author",
        "type": "object",
        "properties": {
            "_id"                      : {
                "type": "string"
            },
            "fore_name"                : {
                "type": "string"
            },
            "middle_name"                : {
                "type": "string"
            },
            "last_name"                : {
                "type": "string"
            },
            "initials"                 : {
                "type": "string"
            },
            "collective_name"          : {
                "type": "string"
            },
            "affiliation_info"         : {
                "type": "string"
            },
            "image" : {
                "type": "string"
            },
            "email"                    : {
                "type": "string"
            },
            "emails"                   : {
                "type" : "array",
                "items": {
                    "type": "string"
                }
            },
            "affiliate_relations"      : {
                "type" : "array",
                "items": {
                    "type": "string"
                }
            },
            "old_ids"      : {
                "type" : "array",
                "items": {
                    "type": "string"
                }
            },
            "external_links": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties" : {
                        "key": {"type" : "string"},
                        "id": {"type" : "string"},
                        "type": {"type" : "string"}
                    }
                }
            },
            "pubmed_relations_count"        : {"type": "number"},
            "affiliate_relations_count"     : {"type": "number"},
            "clinical_trial_relations_count": {"type": "number"},
            "grant_relations_count"         : {"type": "number"},
            "patent_relations_count"        : {"type": "number"},
            "mailing_bioseek_author_invitation": { "type"  : "string", "format": "date-time"},
            "mailing_bioseek_author_invitation_emails": { "type"  : "array", "items": {"type": "string"}},
            "mailing_bioseek_author_invitation_all_emails": { "type"  : "boolean"},

            "unsubscribe" : {
                "type" : "array",
                "items": {
                    "type": "string"
                }
            },
            "domain_checked"                : {"type": "boolean"},
            "views"                         : {"type": "number"},
            "posts"                         : {"type": "number"},
            "rel_version"                   : {"type": "number"}
        },
        "additionalProperties": false
    },

    "settings": {
        "index": "bioseek-author",
        "doc_type": "author",
        "mapping": {
            "aliases": {
                "bioseek-author": {}
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
                        },
                        "ascii_analyzer" : {
                            "tokenizer" : "keyword",
                            "filter" : ["lowercase", "asciifolding"]
                        },
                        "ascii_ngram_analyzer" : {
                            "tokenizer" : "keyword",
                            "filter" : ["lowercase", "asciifolding", "edge_filter"]
                        }
                    }
                }
            },
            "mappings": {
                "author": {
                    "properties": {
                        "name": {
                            "type": "keyword",
                            "store" : true,
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
                        "fore_name": {
                            "type": "keyword",
                            "copy_to" : "name",
                            "fields" : {
                                "ascii_main" : {
                                    "type" : "text",
                                    "analyzer" : "ascii_analyzer",
                                    "search_analyzer": "ascii_analyzer"
                                },
                                "ascii_support" : {
                                    "type" : "text",
                                    "analyzer" : "ascii_ngram_analyzer",
                                }
                            }
                        },
                        "middle_name": {
                            "type": "keyword",
                            "copy_to" : "name",
                            "fields" : {
                                "ascii_main" : {
                                    "type" : "text",
                                    "analyzer" : "ascii_analyzer",
                                    "search_analyzer": "ascii_analyzer"
                                },
                                "ascii_support" : {
                                    "type" : "text",
                                    "analyzer" : "ascii_ngram_analyzer",
                                }
                            }
                        },
                        "last_name": {
                            "type": "keyword",
                            "copy_to" : "name",
                            "fields" : {
                                "ascii_main" : {
                                    "type" : "text",
                                    "analyzer" : "ascii_analyzer",
                                    "search_analyzer": "ascii_analyzer"
                                },
                                "ascii_support" : {
                                    "type" : "text",
                                    "analyzer" : "ascii_ngram_analyzer",
                                }
                            }
                        },
                        "email": {
                            "type": "keyword"
                        },
                        "emails": {
                            "type": "keyword"
                        },
                        "image": {
                            "type": "keyword"
                        },
                        "initials": {
                            "type": "keyword"
                        },
                        "collective_name": {
                            "type": "keyword",
                            "copy_to" : "name"
                        },
                        "old_ids": {
                            "type": "keyword"
                        },
                        "unsubscribe": {
                            "type": "keyword"
                        },
                        "identifier": {
                            "type": "keyword",
                            "fields": {
                                "raw": {
                                    "type": "text",
                                    "analyzer": "term_lowercase"
                                },
                                "main": {
                                    "type": "text",
                                    "analyzer": "whitespace"
                                }
                            }
                        },
                        "external_links": {"type" : "object",
                            "properties" : {
                                "key" : {"type": "keyword"},
                                "id" : {"type": "keyword"},
                                "type" : {"type": "keyword"},
                            }
                        },
                        "affiliate_relations"              : {"type": "keyword"},
                        "pubmed_relations_count"           : {"type": "integer", "doc_values": true},
                        "affiliate_relations_count"        : {"type": "integer", "index": false, "doc_values": true},
                        "clinical_trial_relations_count"   : {"type": "integer", "index": false, "doc_values": true},
                        "grant_relations_count"            : {"type": "integer", "index": false, "doc_values": true},
                        "patent_relations_count"           : {"type": "integer", "index": false, "doc_values": true},
                        "mailing_bioseek_author_invitation": {"type": "date"},
                        "mailing_bioseek_author_invitation_emails": {"type": "keyword"},
                        "mailing_bioseek_author_invitation_all_emails": {"type": "boolean"},
                        "domain_checked"                   : {"type": "boolean"},
                        "views"                            : {"type": "integer", "index": false, "doc_values": true},
                        "posts"                            : {"type": "integer", "index": false, "doc_values": true}
                    }
                }
            }
        }
    },

    "database": "elasticsearch"
};