
exports.schema =
{
    "title": "antibody",
    "type": "object",
    "properties": {
        "supplier": {"type": "string"},
        "catalog_no": { "type": "string" },
        "name": { "type": "string" },
        "size": {
            "type": "object",
            "properties" : {
                "quantity" : { "type" : "number"},
                "units" : { "type" : "string" },
                "type" : { "type" : ["string", "null"] }
            }
        },
        "price": {
            "type" : "object",
            "properties": {
                "currency": {"type": "string"},
                "isPromotion": {"type": "boolean"},
                "promotion": {
                    "type" : "object",
                    "properties": {
                        "discount": {"type": "number"},
                        "discountPercentage": {"type": "number"},
                        "originalValue": {"type": "number"}
                    }
                },
                "value": {"type": "number", "minimum" : 0}
            }
        },
        "subtype": {"type": "string"},
        "bio_object": {"type": "string" },
        "bio_object_synonyms" : {"type": ["string", "array", "null"] },
        "bio_object_type" : {"type": "string"},
        "ncbi_id" : {"type": "string" },
        "uniprot_id" : {"type": "string"},
        "keg_id" : {"type": "string"},
        "storage": {"type": ["string", "null"]},
        "description": {"type": ["string", "null"]},

        "clone_id": {"type": ["string", "null"]},
        "application": {"type": ["array", "null"], "items": {"type": "string"}},
        "application_info": {"type": ["string", "null"]},
        "clonality": {"type": ["string", "null"]},
        "conjugate": {"type": ["string", "array"]},
        "purification": {"type": ["string", "null"]},
        "concentration": {"type": ["string", "null"]},
        "reactivity": {"type": ["array", "null"], "items": {"type": "string"}},
        "host": {"type": ["string", "null"]},
        "isotype": {"type": ["array", "null"], "items": {"type": "string"}},
        "form": {"type": ["string", "null"]},
        "usage": {"type": ["string", "null"]},
        "immunogen" : {"type": ["string", "null"]},
        "advisory": {"type": ["string", "null"]},
        "combined": {"type": ["string", "null"]},
        "ui" : {
            "properties" : {
                "clonality_ui" : {  "type" : ["string", "null"]},
                "host_ui" : {  "type" : ["string", "null"]},
                "reactivity_ui" : {  "type" : ["array", "string", "null"]},
                "gene_ui" : {  "type" : ["array", "string", "null"]},
                "application_ui" : {  "type" : ["array", "string", "null"]},
                "conjugate_ui" : {  "type" : ["string", "null"]},
                "isotype_ui" : {  "type" : ["array", "string", "null"]}
            }
        },
        "supplier_specific" : {
            "type" : "object"
        }

    },
    "required" : ["catalog_no", "supplier", "subtype"],
    "additionalProperties" : false
};

exports.settings = {
    "index" : "gentaur-data",
    "doc_type" : "antibody",
    "mapping": {
        "aliases": {
            "gentaur-data": {}
        },
        "settings": {
            "analysis": {
                "filter": {
                    "autocomplete_filter": {
                        "type": "edge_ngram",
                        "min_gram": 2,
                        "max_gram": 20
                    }
                },
                "analyzer": {
                    "whitelowercase": {
                        "type": "custom",
                        "tokenizer": "whitespace",
                        "filter": ["lowercase"]
                    },
                    "term_lowercase": {
                        "type" : "custom",
                        "tokenizer": "keyword",
                        "filter": ["lowercase"]
                    },
                    "autocomplete": {
                        "type": "custom",
                        "tokenizer": "standard",
                        "filter": [ "lowercase", "autocomplete_filter" ]
                    }
                }
            }
        },
        "mappings": {
            "antibody": {
                "properties": {
                    "supplier": {"type": "text", "fielddata": true},
                    "catalog_no": {"type": "keyword"},
                    "name": {"type": "text", "analyzer": "whitelowercase"},
                    "size": {
                        "properties" : {
                            "quantity" : { "type" : "long" },
                            "units" : { "type" : "keyword" },
                            "type" : { "type" : "keyword" }
                        }
                    },
                    "price": {
                        "properties": {
                            "currency": {
                                "type": "keyword",
                                "fields": {
                                    "keyword": {
                                        "type": "keyword",
                                        "ignore_above": 256
                                    }
                                }
                            },
                            "isPromotion": {"type": "boolean"},
                            "promotion": {
                                "properties": {
                                    "discount": {"type": "long"},
                                    "discountPercentage": {"type": "long"},
                                    "originalValue": {"type": "long"}
                                }
                            },
                            "value": {"type": "long"}
                        }
                    },
                    "subtype": {"type": "text", "fielddata": true},
                    "bio_object": {
                        "type": "text",
                        "analyzer": "whitelowercase",
                        "fielddata": true,
                        "fields" : {
                            "raw": {
                                "type": "text",
                                "analyzer": "term_lowercase"
                            },
                            "main": {
                                "type": "text",
                                "analyzer": "autocomplete",
                                "search_analyzer": "standard"
                            }
                        }
                    },
                    "bio_object_synonyms" : {
                        "type": "text",
                        "analyzer": "whitelowercase"
                    },
                    "bio_object_type" : {"type": "keyword" },
                    "ncbi_id" : {"type": "keyword" },
                    "uniprot_id" : {"type": "keyword" },
                    "keg_id" : {"type": "keyword" },
                    "storage": {"type": "text" },
                    "description": {"type": "text" },

                    "clone_id" : { "type" : "keyword" },
                    "application": {"type": "text", "analyzer": "whitelowercase", "fielddata": true},
                    "application_info": {"type": "text" },
                    "clonality": {"type": "text","fielddata": true},
                    "conjugate": {"type": "text", "fielddata": true},
                    "purification": {"type": "text" },
                    "concentration": {"type": "text" },
                    "host": {"type": "text", "fielddata": true},
                    "reactivity": {"type": "text", "analyzer": "whitelowercase", "fielddata": true},
                    "isotype": {"type": "text", "fielddata": true},
                    "form" : {"type": "keyword"},
                    "usage" : {"type": "keyword"},
                    //"binding" ????
                    "immunogen" : {"type": "text"},
                    // "advisory": {"type": "text"},
                    "combined": {"type": "text", "analyzer": "whitelowercase"},
                    "ui" : {
                        "properties" : {
                            "clonality_ui" : {  "type" : "keyword" },
                            "host_ui" : {  "type" : "keyword" },
                            "reactivity_ui" : {  "type" : "keyword" },
                            "bio_object_ui" : {  "type" : "keyword" },
                            "application_ui" : {  "type" : "keyword" },
                            "conjugate_ui" : {  "type" : "keyword" },
                            "isotype_ui" : {  "type" : "keyword" }
                        }
                    },
                    "supplier_specific" : {
                        "properties" : {}
                    }
                }
            }
        }
    }
};

exports.database = 'elasticsearch';