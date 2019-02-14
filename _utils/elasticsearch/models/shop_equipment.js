let stopwords          = require("./stopwords.en.json");
let char_filter        = require("./_analysis_resource/char_filter.json");
let analysis_filters   = require("./_analysis_resource/filters.json");
let analysis_analyzers = require("./_analysis_resource/analyzers.json");
let shop_model         = require("./_analysis_resource/shop_model.json");

exports.schema =
    {
        "title"     : "equipment",
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
            "product_category_relations"       : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "product_sub_category_relations"       : {
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
            "specification"       : {
                "type" : "array",
                "items": {"type": "string"}
            },
            "table_specification"       : {
                "type": "array",
                "items": {"type": "object"}
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
                        "text"      : {"type": "array", "items": {"type": "string"}},
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
            "ui"                : {
                "product_category": {
                    "type" : "array",
                    "items": {"type": "string"}
                },
                "product_sub_category": {
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
    "index"   : "shop_equipment",
    "doc_type": "equipment",
    "mapping" : {
        "aliases" : {
            "shop_equipment": {}
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
            "equipment": {
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
                    "oid"                    : {"type": "keyword"},
                    "human_readable_id"      : {"type": "keyword"},
                    "product_category_relations"     : {"type": "keyword"},
                    "product_sub_category_relations" : {"type": "keyword"},
                    "distributor_relations"  : {"type": "keyword"},
                    "supplier_relations"     : {"type": "keyword"},
                    "specification"          : {"type": "keyword"},
                    "table_specification"    : {"type": "object" },
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
                            "product_category"     : {"type": "keyword"},
                            "product_sub_category" : {"type": "keyword"},
                            "supplier"             : {"type": "keyword"},
                            "distributor"          : {"type": "keyword"}
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