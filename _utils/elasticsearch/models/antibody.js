let stopwords          = require("./stopwords.en.json");
let char_filter        = require("./_analysis_resource/char_filter.json");
let analysis_filters   = require("./_analysis_resource/filters.json");
let analysis_analyzers = require("./_analysis_resource/analyzers.json");

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
                                    },
                                    "additionalProperties": false
                                },
                                "product_id": {"type": "string"},
                                "size"      : {
                                    "type"      : "object",
                                    "properties": {
                                        "value"   : {"type": "number"},
                                        "dimension": {"type": "string"},
                                        "more_data": {"type": "string"}
                                    },
                                    "additionalProperties": false
                                }
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
                },
                "supplier": {
                    "type" : "array",
                    "items": {"type": "string"}
                },
                "distributor": {
                    "type" : "array",
                    "items": {"type": "string"}
                }
            }
        },

        "additionalProperties": false
    };

exports.settings = {
    "index"   : "shop-antibody",
    "doc_type": "antibody",
    "mapping" : {
        "aliases" : {
            "shop-antibody": {}
        },
        "settings": {
            "analysis": {
                "char_filter": char_filter,
                "filter"     : {
                    "edge_filter"   : analysis_filters.edge_filter,
                    "stop"          : {
                        "type"     : "stop",
                        "stopwords": stopwords
                    },
                    "word_delimeter": analysis_filters.word_delimeter
                },
                "analyzer"   : analysis_analyzers
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
                                    "size"      : {
                                        "type"      : "object",
                                        "properties": {
                                            "value"   : {"type": "float"},
                                            "dimension": {"type": "keyword"},
                                            "more_data": {"type": "keyword"}
                                        }
                                    }
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
                            "conjugate"    : {"type": "keyword"},
                            "supplier"     : {"type": "keyword"},
                            "distributor"  : {"type": "keyword"}
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