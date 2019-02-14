let stopwords          = require("./stopwords.en.json");
let char_filter        = require("./_analysis_resource/char_filter.json");
let analysis_filters   = require("./_analysis_resource/filters.json");
let analysis_analyzers = require("./_analysis_resource/analyzers.json");
let shop_model         = require("./_analysis_resource/shop_model.json");

exports.schema =
    {
        "title"     : "protein",
        "type"      : "object",
        "properties": {
            "_id"                         : {"type": "string"},
            "name"                        : {"type": "string"},
            "description"                 : {"type": "string"},
            "oid"                         : {"type": "string"},
            "human_readable_id"           : {"type": "string"},
            "external_links"              : {
                "type" : "array",
                "items": {
                    "type"      : "object",
                    "properties": {
                        "key": {"type": "string"},
                        "id" : {"type": "string"}
                    }
                }
            },
            "bio_object"                  : shop_model.schema.bio_object,
            "supplier_relations"          : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "distributor_relations"       : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "research_area_relations"     : {
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
            "preparation_method_relations": {
                "type" : "array",
                "items": {"type": "string"}
            },
            "storage_conditions"          : {"type": "string"},
            "shelf_life"                  : {"type": "string"},
            "delivery_conditions"         : {"type": "string"},
            "sequence"                    : {"type": "string"},
            "protein_length"              : {"type": "string"},
            "purity"                      : {"type": "string"},
            "formulation"                 : {"type": "string"},
            "molecular_weight"            : {"type": "string"},
            "fragment"                    : {"type": "string"},
            "molecular_weight_predicted"  : {"type": "string"},
            "subcell_location"            : {"type": "string"},
            "endotoxin_level"             : {"type": "string"},
            "buffer_form"                 : {"type": "string"},
            "traits"                      : {"type": "string"},
            "isoelectric_point"           : {"type": "number"},
            "source"                      : {"type": "string"},
            "tag"                         : {"type": "string"},
            "original_link"               : {"type": "string"},
            "activity"                    : {
                "type" : "array",
                "items": {
                    "type": "string"
                }
            },
            "aliases"            : {
                "type" : "array",
                "items" : {
                    "type": "string"
                }
            },
            "precautions"        : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "usage"             : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "pdf"               : {
                "type" : "array",
                "items": {
                    "type"      : "object",
                    "properties": {
                        "link"      : {"type": "string"},
                        "text"      : {"type": "string"},
                        "type"      : {"type": "string"},
                        "thumb_link": {"type": "string"},
                        "lang"      : {"type": "string"}
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
            "price_model"       : shop_model.schema.price_model,
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
            "supplier_specific" : {
                "type": "object",
                "additionalProperties": true
            },
            "distributor_only" : {
                "type": "object",
                "additionalProperties": true
            },
            "ui"                : {
                "preparation_method": {
                    "type" : "array",
                    "items": {"type": "string"}
                },
                "research_area": {
                    "type" : "array",
                    "items": {"type": "string"}
                },
                "reactivity": {
                    "type" : "array",
                    "items": {"type": "string"}
                },
                "application": {
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
    "index"   : "shop_protein",
    "doc_type": "protein",
    "mapping" : {
        "aliases" : {
            "shop_protein": {}
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
            "protein": {
                "properties": {
                    "name"                        : {
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
                    "description"                 : {"type": "keyword", "index": false},
                    "external_links"              : {
                        "type"      : "object",
                        "properties": {
                            "key": {"type": "keyword"},
                            "id" : {"type": "keyword"}
                        }
                    },
                    "bio_object"                  : shop_model.settings.bio_object,
                    "oid"                         : {"type": "keyword"},
                    "human_readable_id"           : {"type": "keyword"},
                    "distributor_relations"       : {"type": "keyword"},
                    "supplier_relations"          : {"type": "keyword"},
                    "research_area_relations"     : {"type": "keyword"},
                    "application_relations"       : {"type": "keyword"},
                    "reactivity_relations"        : {"type": "keyword"},
                    "preparation_method_relations": {"type": "keyword"},
                    "shelf_life"                  : {"type": "keyword"},
                    "storage_conditions"          : {"type": "keyword"},
                    "delivery_conditions"         : {"type": "keyword"},
                    "sequence"                    : {"type": "keyword"},
                    "protein_length"              : {"type": "keyword"},
                    "purity"                      : {"type": "keyword"},
                    "formulation"                 : {"type": "keyword"},
                    "molecular_weight"            : {"type": "keyword"},
                    "activity"                    : {"type": "keyword"},
                    "precautions"                 : {"type": "keyword"},
                    "usage"                       : {"type": "keyword"},
                    "fragment"                    : {"type": "keyword"},
                    "molecular_weight_predicted"  : {"type": "keyword"},
                    "subcell_location"            : {"type": "keyword"},
                    "endotoxin_level"             : {"type": "keyword"},
                    "buffer_form"                 : {"type": "keyword"},
                    "traits"                      : {"type": "keyword"},
                    "isoelectric_point"           : {"type": "keyword"},
                    "source"                      : {"type": "keyword"},
                    "tag"                         : {"type": "keyword"},
                    "original_link"               : {"type": "keyword"},
                    "aliases"                     : {
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
                    "pdf"                         : {

                        "type"      : "object",
                        "properties": {
                            "link"      : {"type": "keyword"},
                            "text"      : {"type": "keyword"},
                            "type"      : {"type": "keyword"},
                            "thumb_link": {"type": "keyword"},
                            "lang"      : {"type": "keyword"}
                        }
                    },
                    "images"                      : {
                        "type"      : "object",
                        "properties": {
                            "link"      : {"type": "keyword"},
                            "text"      : {"type": "keyword"},
                            "type"      : {"type": "keyword"},
                            "thumb_link": {"type": "keyword"}
                        }
                    },
                    "price_model"                 : shop_model.settings.price_model,
                    "search_data"                 : {
                        "type"      : "object",
                        "properties": {
                            "key" : {"type": "keyword"},
                            "text": {
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
                    },
                    "ui"        : {
                        "type": "object",
                        "properties" : {
                            "preparation_method": {"type": "keyword"},
                            "application"       : {"type": "keyword"},
                            "reactivity"        : {"type": "keyword"},
                            "research_area"     : {"type": "keyword"},
                            "supplier"          : {"type": "keyword"},
                            "distributor"       : {"type": "keyword"}
                        }
                    },
                    "supplier_specific": {
                        "type": "object",
                        "properties" : {}
                    },
                    "distributor_only": {
                        "type": "object",
                        "properties" : {}
                    }
                }
            }
        }
    }
};

exports.database = 'elasticsearch';
exports.category = 'shop_product';