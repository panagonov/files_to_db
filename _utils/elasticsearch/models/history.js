exports.schema =
    {
        "title"     : "history",
        "type"      : "object",
        "properties": {
            "_id"           : {"type": ["object", "string", "null"]},
            "user_id"       : {"type": "string"},
            "group_id"      : {"type": ["object", "string", "null"]},
            "type"          : {"enum": ["search", "view"]},
            "item_ids"      : {"type": "array", "items": {"type": "string"}},
            "item_types"    : {"type": "array", "items": {"type": "string"}},
            "pubmed"        : {"type": "array", "items": {"type": "string"}},
            "pathway"       : {"type": "array", "items": {"type": "string"}},
            "gene"          : {"type": "array", "items": {"type": "string"}},
            "author"        : {"type": "array", "items": {"type": "string"}},
            "disease"       : {"type": "array", "items": {"type": "string"}},
            "drug"          : {"type": "array", "items": {"type": "string"}},
            "enzyme"        : {"type": "array", "items": {"type": "string"}},
            "anatomy"       : {"type": "array", "items": {"type": "string"}},
            "organism"      : {"type": "array", "items": {"type": "string"}},
            "process"       : {"type": "array", "items": {"type": "string"}},
            "paper"         : {"type": "array", "items": {"type": "string"}},
            "visual_search" : {"type": "array", "items": {"type": "string"}},
            "mind_map"      : {"type": "array", "items": {"type": "string"}},
            "affiliate"     : {"type": "array", "items": {"type": "string"}},
            "clinical_trial": {"type": "array", "items": {"type": "string"}},

            "search_term"             : {"type": "string"},
            "open_in"                 : {
                "type" : "array",
                "items": {
                    "type" : "array",
                    "items": {
                        "type": "string"
                    }
                }
            },
            "visible"                 : {"type": "boolean"},
            "token_stream"            : {
                "type" : "array",
                "items": {
                    "type" : "array",
                    "items": {
                        "type": "string"
                    }
                }
            },
            "items" : {
                "type" : "array",
                "items" : {
                    "type" : "object",
                    "properties" : {
                        "_id"                           : {"type": "string"},
                        "name"                          : {"type": "string"},
                        "symbol"                        : {"type": "string"},
                        "_type"                         : {"type": "string"},
                        "gene_relations"                : {"type": ["array"], "items": {"type": "string"}},
                        "pathway_relations"             : {"type": ["array"], "items": {"type": "string"}},
                        "pubmed_relations"              : {"type": ["array"], "items": {"type": "string"}},
                        "drug_relations"                : {"type": ["array"], "items": {"type": "string"}},
                        "disease_relations"             : {"type": ["array"], "items": {"type": "string"}},
                        "author_relations"              : {"type": ["array"], "items": {"type": "string"}},
                        "anatomy_relations"             : {"type": ["array"], "items": {"type": "string"}},
                        "organism_relations"            : {"type": ["array"], "items": {"type": "string"}},
                        "process_relations"             : {"type": ["array"], "items": {"type": "string"}},
                        "enzyme_relations"              : {"type": ["array"], "items": {"type": "string"}},
                        "gene_relations_count"          : {"type": "number"},
                        "pathway_relations_count"       : {"type": "number"},
                        "drug_relations_count"          : {"type": "number"},
                        "disease_relations_count"       : {"type": "number"},
                        "author_relations_count"        : {"type": "number"},
                        "enzyme_relations_count"        : {"type": "number"},
                        "organism_relations_count"      : {"type": "number"},
                        "process_relations_count"       : {"type": "number"},
                        "anatomy_relations_count"       : {"type": "number"},
                        "pubmed_relations_count"        : {"type": "number"},
                        "clinical_trial_relations_count": {"type": "number"}
                    }
                }
            },
            "date_created"            : {"type": "string", "format": "date-time"},
            "rel_version"             : {"type": "number"}
        },
        "additionalProperties" : false
    };

exports.settings = {
    "index" : "genetics-history",
    "doc_type" : "history",
    "user_data" : true,
    "mapping": {
        "aliases": {
            "genetics-history": {}
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
            "history": {
                "properties": {
                    "user_id": { "type": "keyword"},
                    "group_id": {"type": "keyword"},
                    "type": {"type": "keyword"},
                    "item_types": {"type": "keyword"},
                    "item_ids": {"type": "keyword"},
                    "open_in": {"type": "keyword"},
                    "search_term": {"type": "keyword",
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
                    "token_stream": { "type": "keyword"},
                    "date_created": {"type": "date"},
                    "visible": {"type": "keyword"},
                    "pubmed"        : {"type": "keyword"},
                    "pathway"       : {"type": "keyword"},
                    "gene"          : {"type": "keyword"},
                    "author"        : {"type": "keyword"},
                    "disease"       : {"type": "keyword"},
                    "drug"          : {"type": "keyword"},
                    "enzyme"        : {"type": "keyword"},
                    "anatomy"       : {"type": "keyword"},
                    "organism"      : {"type": "keyword"},
                    "process"       : {"type": "keyword"},
                    "paper"         : {"type": "keyword"},
                    "visual_search" : {"type": "keyword"},
                    "mind_map"      : {"type": "keyword"},
                    "affiliate"     : {"type": "keyword"},
                    "clinical_trial": {"type": "keyword"},
                    "items" : {"type" : "object",
                        "properties" : {
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
                            "symbol": {
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
                            "_id"                           : {"type": "keyword"},
                            "_type"                         : {"type": "keyword"},
                            "gene_relations"                : {"type": "keyword"},
                            "pathway_relations"             : {"type": "keyword"},
                            "pubmed_relations"              : {"type": "keyword"},
                            "author_relations"              : {"type": "keyword"},
                            "disease_relations"             : {"type": "keyword"},
                            "drug_relations"                : {"type": "keyword"},
                            "process_relations"             : {"type": "keyword"},
                            "anatomy_relations"             : {"type": "keyword"},
                            "organism_relations"            : {"type": "keyword"},
                            "enzyme_relations"              : {"type": "keyword"},
                            "gene_relations_count"          : {"type": "integer", "index": false, "doc_values": true},
                            "pathway_relations_count"       : {"type": "integer", "index": false, "doc_values": true},
                            "drug_relations_count"          : {"type": "integer", "index": false, "doc_values": true},
                            "disease_relations_count"       : {"type": "integer", "index": false, "doc_values": true},
                            "author_relations_count"        : {"type": "integer", "index": false, "doc_values": true},
                            "enzyme_relations_count"        : {"type": "integer", "index": false, "doc_values": true},
                            "organism_relations_count"      : {"type": "integer", "index": false, "doc_values": true},
                            "process_relations_count"       : {"type": "integer", "index": false, "doc_values": true},
                            "anatomy_relations_count"       : {"type": "integer", "index": false, "doc_values": true},
                            "pubmed_relations_count"        : {"type": "integer", "index": false, "doc_values": true},
                            "clinical_trial_relations_count": {"type": "integer", "index": false, "doc_values": true}
                        }
                    }
                }
            }
        }
    }
};

exports.database = 'elasticsearch';