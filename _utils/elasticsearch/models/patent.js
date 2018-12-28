module.exports = {

    "schema": {
        "title": "patent",
        "type": "object",
        "properties": {
            "_id": {
                "type": "string"
            },
            "name": {
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
            "affiliate_relations"           : {
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
            "grant_relations"           : {
                "type" : ["array"],
                "items": {
                    "type": "string"
                }
            },
            "clinical_trial_relations"           : {
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
            "clinical_trial_relations_count": {"type": "number"},
            "affiliate_relations_count"     : {"type": "number"},
            "grant_relations_count"         : {"type": "number"},
            "rel_version"             : {"type": "number"}
        },
        "additionalProperties": false
    },

    "settings": {
        "index": "bioseek-patent",
        "doc_type": "patent",
        "mapping": {
            "aliases": {
                "bioseek-patent": {}
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
                        },
                        "synonym_filter":{
                            "type": "synonym",
                            "synonyms":[
                                "Α,α,a,Alpha",
                                "Β,β,b,Beta",
                                "Γ,γ,g,Gamma",
                                "Δ,δ,d,Delta",
                                "Ε,ε,e,Epsilon",
                                "Ζ,ζ,z,Zeta",
                                "Η,η,e,Eta",
                                "Θ,θ,t,Theta",
                                "Ι,ι,i,Iota",
                                "Κ,κ,k,Kappa",
                                "Λ,λ,l,Lambda",
                                "Μ,μ,m,Mu",
                                "Ν,ν,n,Nu",
                                "Ξ,ξ,h,Xi",
                                "Ο,ο,o,Omicron",
                                "Π,π,p,Pi",
                                "Ρ,ρ,r,Rho",
                                "Σ,σς,s,Sigma",
                                "Τ,τ,t,Tau",
                                "Υ,υ,y,Upsilon",
                                "Φ,φ,f,Phi",
                                "Χ,χ,k,Chi",
                                "Psi,Ψ,ψ,ps",
                                "Ω,ω,o,Omega"
                            ]
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
                "patent": {
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
                        "external_links": {"type" : "object",
                            "properties" : {
                                "id" : {"type": "keyword"},
                                "key" : {"type": "keyword"}
                            }
                        },
                        "gene_id"                       : {"type": "keyword"},
                        "tax_id"                        : {"type": "keyword"},
                        "type_of_gene"                  : {"type": "keyword"},
                        "gene_relations"                : {"type": "keyword"},
                        "pathway_relations"             : {"type": "keyword"},
                        "author_relations"              : {"type": "keyword"},
                        "disease_relations"             : {"type": "keyword"},
                        "drug_relations"                : {"type": "keyword"},
                        "process_relations"             : {"type": "keyword"},
                        "anatomy_relations"             : {"type": "keyword"},
                        "organism_relations"            : {"type": "keyword"},
                        "enzyme_relations"              : {"type": "keyword"},
                        "pubmed_relations"              : {"type": "keyword"},
                        "grant_relations"               : {"type": "keyword"},
                        "affiliate_relations"           : {"type": "keyword"},
                        "clinical_trial_relations"      : {"type": "keyword"},
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
                        "clinical_trial_relations_count": {"type": "integer", "index": false, "doc_values": true},
                        "affiliate_relations_count"     : {"type": "integer", "index": false, "doc_values": true},
                        "grant_relations_count"         : {"type": "integer", "index": false, "doc_values": true},
                        "views"                         : {"type": "integer", "index": false, "doc_values": true},
                        "posts"                         : {"type": "integer", "index": false, "doc_values": true}
                    }
                }
            }
        }
    },

   "database": "elasticsearch"
};