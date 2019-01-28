let stopwords = require("./stopwords.en.json");

exports.schema =
    {
        "title"     : "antibody",
        "type"      : "object",
        "properties": {

            "_id"               : {"type": "string"},
            "name"              : {"type": "string"},
            "description"       : {"type": "string"},
            "oid"               : {"type": "string"},
            "human_readable_id" : {"type": "string"},
            "external_links"    : {
                "type" : "array",
                "items": {
                    "type"      : "object",
                    "properties": {
                        "key": {"type": "string"},
                        "id" : {"type": "string"}
                    }
                }
            },
            "bio_object"        : {
                "type"      : "object",
                "properties": {
                    "type"          : {"type": "string"},
                    "name"          : {"type": "string"},
                    "aliases"       : {
                        "type" : "array",
                        "items": {"type": "string"}
                    },
                    "external_links": {
                        "type" : "array",
                        "items": {
                            "type"      : "object",
                            "properties": {
                                "key": {"type": "string"},
                                "id" : {"type": "string"}
                            }
                        }
                    }
                }
            },
            "host_relations"              : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "reactivity_relations"        : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "application_relations"       : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "isotype_relations"           : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "light_chain_relations"       : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "heavy_chain_relations"       : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "clonality_relations"       : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "research_area_relations"       : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "distributor_relations"       : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "supplier_relations"       : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "conjugate_relations"       : {
                "type" : "array",
                "items": {"type": "string"}
            },

            "purification"       : {"type": "string"},
            "formulation"        : {"type": "string"},
            "concentration"      : {"type": "string"},
            "clone_id"           : {"type": "string"},
            "buffer_form"        : {"type": "string"},
            "shelf_life"         : {"type": "string"},
            "storage_conditions" : {"type": "string"},
            "delivery_conditions": {"type": "string"},
            "immunogen"          : {"type": "string"},
            "research_area"     : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "supplier_specific" : {
                "type": "object",
                "additionalProperties": true
            },
            "pdf"               : {
                "type" : "array",
                "items": {
                    "type"      : "object",
                    "properties": {
                        "link"      : {"type": "string"},
                        "text"      : {"type": "string"},
                        "type"      : {"type": "string"},
                        "thumb_link": {"type": "string"}
                    }
                }
            },
            "images"            : {
                "type" : "array",
                "items": {
                    "type"      : "object",
                    "properties": {
                        "link"      : {"type": "string"},
                        "text"      : {"type": "string"},
                        "type"      : {"type": "string"},
                        "thumb_link": {"type": "string"}
                    }
                }
            },
            "usage"             : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "price_model"       : {
                "type"      : "object",
                "properties": {
                    "sort_price"       : {"type": "number"},
                    "is_multiple"      : {"type": "boolean"},
                    "is_ids_are_unique": {"type": "boolean"},
                    "discount"         : {
                        "type"                : "object",
                        "properties"          : {
                            "default": {
                                "type"          : "object",
                                "properties"    : {
                                    "discount_type": {"enums": ["absolute", "percent"]}
                                },
                                "discount_value": {"type": "number"}
                            }
                        },
                        "additionalProperties": true
                    },
                    "variation"        : {
                        "type" : "array",
                        "items": {
                            "type"      : "object",
                            "properties": {
                                "price"     : {
                                    "type"      : "object",
                                    "properties": {
                                        "value"   : {"type": "number"},
                                        "currency": {"type": "string"}
                                    }
                                },
                                "product_id": {"type": "string"},
                                "size"      : {"type": "string"}
                            }
                        }
                    }
                }
            },
            "search_data"       : {
                "type": "array",
                "items" : {
                    "type" : "object",
                    "properties" : {
                        "key" : {"type" : "string"},
                        "text": {"type" : "string"}
                    }
                }
            },
            "ui"                : {
                "host"       : {"type": "string"},
                "reactivity" : {
                    "type" : "array",
                    "items": {"type": "string"}
                },
                "application": {
                    "type" : "array",
                    "items": {"type": "string"}
                },
                "isotype"    : {
                    "type" : "array",
                    "items": {"type": "string"}
                },
                "light_chain": {
                    "type" : "array",
                    "items": {"type": "string"}
                },
                "heavy_chain": {
                    "type" : "array",
                    "items": {"type": "string"}
                },
                "clonality": {
                    "type" : "array",
                    "items": {"type": "string"}
                },
                "research_area": {
                    "type" : "array",
                    "items": {"type": "string"}
                },
                "conjugate": {
                    "type" : "array",
                    "items": {"type": "string"}
                }
            }
        },

        "additionalProperties": false
    };

exports.settings = {
    "index"   : "shop-product",
    "doc_type": "antibody",
    "mapping" : {
        "aliases" : {
            "shop-product": {}
        },
        "settings": {
            "analysis": {
                "char_filter": {
                    "my_char_filter": {
                        "type"    : "mapping",
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
                "filter"     : {
                    "edge_filter"   : {
                        "type"    : "edge_ngram",
                        "min_gram": 1,
                        "max_gram": 256
                    },
                    "stop"          : {
                        "type"     : "stop",
                        "stopwords": stopwords
                    },
                    "word_delimeter": {
                        "type"                   : "word_delimiter",
                        "generate_word_parts"    : true, // false
                        "generate_number_parts"  : true,
                        "catenate_all"           : true,
                        "split_on_case_change"   : true,
                        "preserve_original"      : true,
                        "split_on_numerics"      : true, // false
                        "stem_english_possessive": false
                    }
                },
                "analyzer"   : {
                    "edge_phrase_analyzer": {
                        "type"       : "custom",
                        "char_filter": ["my_char_filter"],
                        "tokenizer"  : "keyword",
                        "filter"     : ["lowercase", "edge_filter"]
                    },
                    "term_lowercase"      : {
                        "type"       : "custom",
                        "char_filter": ["my_char_filter"],
                        "tokenizer"  : "keyword",
                        "filter"     : ["lowercase"]
                    },
                    "edge_analyzer"       : {
                        "type"       : "custom",
                        "char_filter": ["my_char_filter"],
                        "tokenizer"  : "whitespace",
                        "filter"     : ["lowercase", "stop", "word_delimeter", "edge_filter"]
                    },
                    "syn_analyzer"        : {
                        "type"       : "custom",
                        "char_filter": ["my_char_filter"],
                        "tokenizer"  : "whitespace",
                        "filter"     : ["lowercase", "edge_filter", "stop"]
                    },
                    "lowercase_whitespace": {
                        "type"       : "custom",
                        "char_filter": ["my_char_filter"],
                        "tokenizer"  : "whitespace",
                        "filter"     : ["lowercase", "stop"]
                    }
                }
            }
        },
        "mappings": {
            "antibody": {
                "properties": {
                    "name"              : {
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
                            },
                            "phrase" : {
                                "type"    : "text",
                                "analyzer": "standard"
                            }
                        }
                    },
                    "description"       : {"type": "keyword", "index": false},
                    "external_links"    : {
                        "type"      : "object",
                        "properties": {
                            "key": {"type": "keyword"},
                            "id" : {"type": "keyword"}
                        }
                    },
                    "bio_object"        : {
                        "type"          : "object",
                        "properties"    : {
                            "type"   : {"type": "keyword"},
                            "name"   : {"type": "keyword"},
                            "aliases": {"type": "keyword"},
                            "external_links": {
                                "type"      : "object",
                                "properties": {
                                    "key": {"type": "keyword"},
                                    "id" : {"type": "keyword"}
                                }
                            }
                        },
                    },
                    "oid"                    : {"type": "keyword"},
                    "human_readable_id"      : {"type": "keyword"},
                    "host_relations"         : {"type": "keyword"},
                    "reactivity_relations"   : {"type": "keyword"},
                    "application_relations"  : {"type": "keyword"},
                    "isotype_relations"      : {"type": "keyword"},
                    "light_chain_relations"  : {"type": "keyword"},
                    "heavy_chain_relations"  : {"type": "keyword"},
                    "conjugate_relations"    : {"type": "keyword"},
                    "clonality_relations"    : {"type": "keyword"},
                    "research_area_relations": {"type": "keyword"},
                    "distributor_relations"  : {"type": "keyword"},
                    "supplier_relations"     : {"type": "keyword"},
                    "purification"           : {"type": "keyword"},
                    "formulation"            : {"type": "keyword"},
                    "concentration"          : {"type": "keyword"},
                    "clone_id"               : {"type": "keyword"},
                    "buffer_form"            : {"type": "keyword"},
                    "immunogen"              : {"type": "keyword"},
                    "research_area"          : {"type": "keyword"},
                    "usage"                  : {"type": "keyword"},
                    "self_life"              : {"type": "keyword"},
                    "storage_condition"      : {"type": "keyword"},
                    "delivery_condition"     : {"type": "keyword"},
                    "shelf_life"             : {"type": "keyword"},
                    "storage_conditions"     : {"type": "keyword"},
                    "delivery_conditions"    : {"type": "keyword"},
                    "pdf"               : {

                        "type"      : "object",
                        "properties": {
                            "link"      : {"type": "keyword"},
                            "text"      : {"type": "keyword"},
                            "type"      : {"type": "keyword"},
                            "thumb_link": {"type": "keyword"}
                        }
                    },

                    "images"     : {
                        "type"      : "object",
                        "properties": {
                            "link"      : {"type": "keyword"},
                            "text"      : {"type": "keyword"},
                            "type"      : {"type": "keyword"},
                            "thumb_link": {"type": "keyword"}
                        }
                    },
                    "price_model": {
                        "type"      : "object",
                        "properties": {
                            "sort_price"       : {"type": "float", "doc_values": true},
                            "is_multiple"      : {"type": "boolean"},
                            "is_ids_are_unique": {"type": "boolean"},
                            "discount"         : {
                                "type"      : "object",
                                "properties": {
                                    "default": {
                                        "type"          : "object",
                                        "properties"    : {
                                            "discount_type": {"type": "keyword"},
                                            "discount_value": {"type": "float"}
                                        },
                                    }
                                }
                            },
                            "variation"        : {
                                "type"      : "object",
                                "properties": {
                                    "price"     : {
                                        "type"      : "object",
                                        "properties": {
                                            "value"   : {"type": "float"},
                                            "currency": {"type": "keyword"}
                                        }
                                    },
                                    "product_id": {"type": "keyword"},
                                    "size"      : {"type": "keyword"}
                                }
                            }
                        }
                    },
                    "search_data": {
                        "type"  : "object",
                        "properties" : {
                            "key"       : {"type": "keyword"},
                            "text"      : {
                                "type": "keyword",
                                "fields": {
                                    "raw"    : {
                                        "type"    : "text",
                                        "analyzer": "term_lowercase"
                                    },
                                    "main"   : {
                                        "type"           : "text",
                                        "analyzer"       : "edge_phrase_analyzer",
                                        "search_analyzer": "term_lowercase"
                                    }
                                }
                            }
                        }
                    },
                    "ui"        : {
                        "type": "object",
                        "properties" : {
                            "host"         : {"type": "keyword"},
                            "reactivity"   : {"type": "keyword"},
                            "application"  : {"type": "keyword"},
                            "isotype"      : {"type": "keyword"},
                            "light_chain"  : {"type": "keyword"},
                            "heavy_chain"  : {"type": "keyword"},
                            "clonality"    : {"type": "keyword"},
                            "research_area": {"type": "keyword"},
                            "conjugate"    : {"type": "keyword"}
                        }
                    },

                    "supplier_specific": {
                        "type": "object",
                        "properties" : {}
                    }
                }
            }
        }
    }
};

exports.database = 'elasticsearch';