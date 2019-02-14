let stopwords          = require("./stopwords.en.json");
let char_filter        = require("./_analysis_resource/char_filter.json");
let analysis_filters   = require("./_analysis_resource/filters.json");
let analysis_analyzers = require("./_analysis_resource/analyzers.json");

exports.schema =
    {
        "title"     : "distributor",
        "type"      : "object",
        "properties": {
            "_id"               : {"type": "string"},
            "name"              : {"type": "string"},
            "description"       : {"type": "string"},
            "logo"              : {"type": "string"},
            "address"           : {
                "type" : "array",
                "items" : {
                    "type": "object",
                    "properties" : {
                        "country"        : {"type": "string"},
                        "city"           : {"type": "string"},
                        "state"          : {"type": "string"},
                        "zip_code"       : {"type": "string"},
                        "street_address" : {"type": "string"},
                        "geocode": {
                            "type" : "object",
                            "properties" :{
                                "lat" : {"type" : "number"},
                                "lng" : {"type" : "number"}
                            }
                        },
                    }
                }
            },
            "contacts"           : {
                "type" : "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "type"        : {"type": "string"},
                        "contact_name": {"type": "string"},
                        "value"       : {"type": "string"},
                        "important"   : {"type": "boolean"}
                    }
                }
            },
            "shipping" : {
                "type"                : "object",
                "properties"          : {
                    "default" : {
                        "type"                : "object",
                        "properties"          : {
                            "value"   : {"type": "number"},
                            "currency": {"type": "string"}
                        }
                    }
                },
                "additionalProperties": true
            }
        },
        "additionalProperties": false
    };

exports.settings = {
    "index"   : "shop_distributor",
    "doc_type": "distributor",
    "mapping" : {
        "aliases" : {
            "shop_distributor": {}
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
            "distributor": {
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
                    "logo" : {"type": "keyword"},
                    "address" : {
                        "type": "object",
                        "properties" : {
                            "country"        : {"type": "keyword"},
                            "city"           : {"type": "keyword"},
                            "state"          : {"type": "keyword"},
                            "zip_code"       : {"type": "keyword"},
                            "street_address" : {"type": "keyword"},
                            "geocode": {
                                "type" : "object",
                                "properties" :{
                                    "lat" : {"type" : "float"},
                                    "lng" : {"type" : "float"}
                                }
                            }
                        }
                    },
                    "contacts" : {
                        "type": "object",
                        "properties" : {
                            "type"        : {"type": "keyword"},
                            "contact_name": {"type": "keyword"},
                            "value"       : {"type": "keyword"},
                            "important"   : {"type": "boolean"}
                        }
                    },
                    "shipping" : {
                        "type"      : "object",
                        "properties": {
                            "default": {
                                "type"          : "object",
                                "properties"    : {
                                    "value": {"type": "float"},
                                    "currency": {"type": "keyword"}
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

exports.database = 'elasticsearch';