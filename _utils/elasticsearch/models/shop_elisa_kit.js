let stopwords          = require("./stopwords.en.json");
let char_filter        = require("./_analysis_resource/char_filter.json");
let analysis_filters   = require("./_analysis_resource/filters.json");
let analysis_analyzers = require("./_analysis_resource/analyzers.json");
let shop_model         = require("./_analysis_resource/shop_model.json");

exports.schema =
    {
        "title"     : "elisa_kit",
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
            "bio_object"        :  shop_model.schema.bio_object,
            "reactivity_relations"        : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "application_relations"       : {
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
            "test_method_relations"       : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "conjugate_relations"       : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "research_area"     : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "sample_type"     : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "kit_components"     : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "formulation"        : {"type": "string"},
            "shelf_life"         : {"type": "string"},
            "storage_conditions" : {"type": "string"},
            "delivery_conditions": {"type": "string"},
            "sensitivity"        : {"type": "string"},
            "assay_length"       : {"type": "string"},

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
            "specificity"             : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "precision"             : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "stability"             : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "procedure"             : {
                "type" : "array",
                "items": {"type": "string"}
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
            "ui"                : {
                "reactivity": {
                    "type" : "array",
                    "items": {"type": "string"}
                },
                "application": {
                    "type" : "array",
                    "items": {"type": "string"}
                },
                "research_area": {
                    "type" : "array",
                    "items": {"type": "string"}
                },
                "test_method": {
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
    "index"   : "shop_elisa_kit",
    "doc_type": "elisa_kit",
    "mapping" : {
        "aliases" : {
            "shop_elisa_kit": {}
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
            "elisa_kit": {
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
                    "bio_object"             :  shop_model.settings.bio_object,
                    "oid"                    : {"type": "keyword"},
                    "human_readable_id"      : {"type": "keyword"},
                    "reactivity_relations"   : {"type": "keyword"},
                    "application_relations"  : {"type": "keyword"},
                    "test_method_relations"  : {"type": "keyword"},
                    "research_area_relations": {"type": "keyword"},
                    "distributor_relations"  : {"type": "keyword"},
                    "supplier_relations"     : {"type": "keyword"},
                    "conjugate_relations"    : {"type": "keyword"},
                    "kit_components"         : {"type": "keyword"},
                    "purification"           : {"type": "keyword"},
                    "formulation"            : {"type": "keyword"},
                    "concentration"          : {"type": "keyword"},
                    "clone_id"               : {"type": "keyword"},
                    "buffer_form"            : {"type": "keyword"},
                    "immunogen"              : {"type": "keyword"},
                    "research_area"          : {"type": "keyword"},
                    "usage"                  : {"type": "keyword"},
                    "shelf_life"             : {"type": "keyword"},
                    "storage_conditions"     : {"type": "keyword"},
                    "delivery_conditions"    : {"type": "keyword"},
                    "sensitivity"            : {"type": "keyword"},
                    "sample_type"            : {"type": "keyword"},
                    "assay_length"           : {"type": "keyword"},
                    "specificity"            : {"type": "keyword"},
                    "precision"              : {"type": "keyword"},
                    "stability"              : {"type": "keyword"},
                    "procedure"              : {"type": "keyword"},
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
                    "price_model": shop_model.settings.price_model,
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
                            "reactivity"   : {"type": "keyword"},
                            "application"  : {"type": "keyword"},
                            "research_area": {"type": "keyword"},
                            "test_method"  : {"type": "keyword"},
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
exports.category = 'shop_product';