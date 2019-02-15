let stopwords = require("./stopwords.en.json");

module.exports = {

    "schema": {
        "title"             : "pubmed",
        "type"              : "object",
        "properties"        : {
            "_id"           : {
                "type": "string"
            },
            "name"          : {
                "type": "string"
            },
            "description"   : {
                "type": "array",
                "items" : {"type" : "string"}
            },
            "authors"       : {
                "type" : ["array", "null"],
                "items": {
                    "type"                : "object",
                    "properties"          : {
                        "_id"             : {"type": "string"},
                        "fore_name"       : {"type": "string"},
                        "middle_name"     : {"type": "string"},
                        "last_name"       : {"type": "string"},
                        "initials"        : {"type": "string"},
                        "collective_name" : {"type": "string"},
                        "affiliation_info": {"type": "string"}
                    },                }
            },
            "journal"       : {
                "type" : "object",
                "items": {
                    "type"                : "object",
                    "properties"          : {
                        "Title": {"type": "string"},
                    },
                    "additionalProperties": true
                }
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
            "date_created"  : {
                "type"  : "string",
                "format": "date-time"
            },
            "date_completed": {
                "type"  : "string",
                "format": "date-time"
            },
            "date_revised"  : {
                "type"  : "string",
                "format": "date-time"
            },
            "gene_relations"           : {
                "type" : ["array"],
                "items": {
                    "type": "string"
                }
            },
            "pathway_relations"           : {
                "type" : ["array"],
                "items": {
                    "type": "string"
                }
            },
            "drug_relations"           : {
                "type" : ["array"],
                "items": {
                    "type": "string"
                }
            },
            "disease_relations"           : {
                "type" : ["array"],
                "items": {
                    "type": "string"
                }
            },
            "author_relations"           : {
                "type" : ["array"],
                "items": {
                    "type": "string"
                }
            },
            "anatomy_relations"           : {
                "type" : ["array"],
                "items": {
                    "type": "string"
                }
            },
            "organism_relations"           : {
                "type" : ["array"],
                "items": {
                    "type": "string"
                }
            },
            "process_relations"           : {
                "type" : ["array"],
                "items": {
                    "type": "string"
                }
            },
            "enzyme_relations"           : {
                "type" : ["array"],
                "items": {
                    "type": "string"
                }
            },
            "pubmed_relations"           : {
                "type" : ["array"],
                "items": {
                    "type": "string"
                }
            },
            "affiliate_relations"         : {
                "type" : ["array"],
                "items": {
                    "type": "string"
                }
            },
            "grant_relations"           : {
                "type" : ["array"],
                "items": {
                    "type": "string"
                }
            },
            "patent_relations"         : {
                "type" : ["array"],
                "items": {
                    "type": "string"
                }
            },
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
            "affiliate_relations_count"     : {"type": "number"},
            "clinical_trial_relations_count": {"type": "number"},
            "grant_relations_count"         : {"type": "number"},
            "patent_relations_count"        : {"type": "number"},
            "views"                         : {"type": "number"},
            "posts"                         : {"type": "number"},
            "rel_version"                   : {"type": "number"},
            "doi_url_version"               : {"type": "number"},
            "doi_search_version"            : {"type": "number"},
            "pmc_author_version"            : {"type": "number"},
            "researchgate_version"          : {"type": "number"},
            "full_author_name_version"      : {"type": "number"},
            "affiliation_version"           : {"type": "number"},
            "email_version"                 : {"type": "number"},
            "scholar_version"               : {"type": "number"},
            "affiliate_analyzer_version"    : {"type": "number"}
        },
        "required"            : [
            "name"
        ],
        "additionalProperties": false
    },

    "settings": {
        "index"   : "bioseek2-pubmed",
        "doc_type": "pubmed",
        "mapping" : {
            "aliases": {
                "bioseek2-pubmed": {}
            },
            "settings" : {
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
                        },
                        "stop": {
                            "type":        "stop",
                            "stopwords": stopwords
                        },
                        "word_delimeter" : {
                            "type" : "word_delimiter",
                            "generate_word_parts" : true, // false
                            "generate_number_parts" : true,
                            "catenate_all" : true,
                            "split_on_case_change" : true,
                            "preserve_original" : true,
                            "split_on_numerics" : true, // false
                            "stem_english_possessive": false
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
                            "filter"   : ["lowercase", "stop", "word_delimeter", "edge_filter"]
                        },
                        "syn_analyzer" : {
                            "type"     : "custom",
                            "char_filter": ["my_char_filter"],
                            "tokenizer": "whitespace",
                            "filter"   : ["lowercase", "edge_filter", "stop"]
                        },
                        "lowercase_whitespace": {
                            "type": "custom",
                            "char_filter": ["my_char_filter"],
                            "tokenizer": "whitespace",
                            "filter": [ "lowercase", "stop" ]
                        }
                    }
                }
            },
            "mappings" : {
                "pubmed": {
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
                                },
                                "phrase" : {
                                    "type": "text",
                                    "analyzer": "standard"
                                }
                            }
                        },
                        "description": {"type": "keyword"},
                        "authors" : {
                            "type": "object",
                            "properties" : {
                                "_id" : {"type": "keyword"}
                            }
                        },
                        "external_links": {"type" : "object",
                            "properties" : {
                                "key" : {"type": "keyword"},
                                "id" : {"type": "keyword"}
                            }
                        },
                        "gene_relations"                : {"type": "keyword"},
                        "pubmed_relations"              : {"type": "keyword"},
                        "pathway_relations"             : {"type": "keyword"},
                        "author_relations"              : {"type": "keyword"},
                        "disease_relations"             : {"type": "keyword"},
                        "drug_relations"                : {"type": "keyword"},
                        "process_relations"             : {"type": "keyword"},
                        "anatomy_relations"             : {"type": "keyword"},
                        "organism_relations"            : {"type": "keyword"},
                        "enzyme_relations"              : {"type": "keyword"},
                        "affiliate_relations"           : {"type": "keyword"},
                        "grant_relations"               : {"type": "keyword"},
                        "patent_relations"              : {"type": "keyword"},
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
                        "affiliate_relations_count"     : {"type": "integer", "index": false, "doc_values": true},
                        "clinical_trial_relations_count": {"type": "integer", "index": false, "doc_values": true},
                        "grant_relations_count"         : {"type": "integer", "index": false, "doc_values": true},
                        "patent_relations_count"        : {"type": "integer", "index": false, "doc_values": true},
                        "date_created"                  : {"type": "date"},
                        "date_completed"                : {"type": "date"},
                        "date_revised"                  : {"type": "date"},
                        "views"                         : {"type": "integer", "index": false, "doc_values": true},
                        "posts"                         : {"type": "integer", "index": false, "doc_values": true}
                    }
                }
            }
        }
    },

    "database": "elasticsearch"
};