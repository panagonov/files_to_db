exports.schema =
{
    "title": "mind_map",
    "type": "object",
    "properties": {
        "_id": { "type": 'string'},
        "user_id": { "type": 'string'},
        "name": { "type": "string" },
        "description": { "type": "string" },
        "preview": { "type": "string" },
        "privacy": { "enum": [ "public", "private", "published" ] },
        "owner": {"type": "object",
            "properties" : {
                "_id": {"type": "string"},
                "email": {"type": "string"},
                "name": {"type": "string"},
                "image": {"type": "string"}
            }
        },
        "date_created": {
            "type": "string",
            "format": "date-time"
        },
        "date_revised": {
            "type": "string",
            "format": "date-time"
        },
        "collaborators": {
            "type": "array",
            "items" : {
                "type" : "object",
                "properties": {
                    "_id": {"type": "string"},
                    "name": {"type": "string"},
                    "email": {"type": "string"},
                    "image": {"type": "string"},
                    "status":{ "enum": [ "invited", "invited_by_email", "accepted", "rejected" ]}
                }
            }
        },
        "nodeDataArray": {
            "type": "array",
            "items" : {
                "type" : "object",
                "properties" : {
                    "type"    : {"type": "string"},
                    "state"   : {"type": "string"},
                    "category": {"type": "string"},
                    "key"     : {"type": "string"},
                    "text"    : {"type": "string"},
                    "_id"     : {"type": "string"},
                    "loc"     : {"type": "string"},
                    "size"     : {
                        "type": "Array",
                        "items" : {
                            "type": "number"
                        }
                    },
                    "color"   : {"type": "string"},
                    "icon"    : {"type": "string"}
                }
            }
        },
        "linkDataArray": {
            "type": "array",
            "items" : {
                "type"      : "object",
                "properties": {
                    "from": {"type": "string"},
                    "to"  : {"type": "string"},
                    "text"  : {"type": "string"},
                    "points"  : {"type": "object"}
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
        "pubmed_relations"           : {
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
        "collaborator_relations"           : {
            "type" : ["array"],
            "items": {
                "type": "string"
            }
        },
        "collaborator_requests"           : {
            "type" : ["array"],
            "items": {
                "type": "string"
            }
        },
        "gene_relations_count"    : {"type": "number"},
        "pathway_relations_count" : {"type": "number"},
        "drug_relations_count"    : {"type": "number"},
        "disease_relations_count" : {"type": "number"},
        "author_relations_count"  : {"type": "number"},
        "enzyme_relations_count"  : {"type": "number"},
        "organism_relations_count": {"type": "number"},
        "process_relations_count" : {"type": "number"},
        "anatomy_relations_count" : {"type": "number"},
        "pubmed_relations_count"  : {"type": "number"},
        "views"                   : {"type": "number"},
        "posts"                   : {"type": "number"},
    },
    "required" : ["owner"],
    "additionalProperties" : false
};

exports.settings = {
    "index" : "genetics-mind_map",
    "doc_type" : "mind_map",
    "user_data" : true,
    "mapping": {
        "aliases": {
            "genetics-mind_map": {}
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
            "mind_map": {
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
                    "description": {"type": "text"},
                    "preview": {"type": "keyword"},
                    "privacy": {"type": "keyword"},
                    "user_id" : {"type": "keyword"},
                    "owner": {"type": "object",
                        "properties" : {
                            "_id": {"type": "keyword"},
                            "email": {"type": "keyword"},
                            "name": {"type": "text"},
                            "image": {"type": "keyword"}
                        }
                    },
                    "collaborators": {
                        "type": "object",
                        "properties": {
                            "_id": {"type": "keyword"},
                            "name": {"type": "text"},
                            "image": {"type": "keyword"},
                            "email": {"type": "keyword"},
                            "status":{ "type": "keyword"}
                        }
                    },
                    "nodeDataArray": {
                        "type": "object",
                        "properties" : {
                            "type"    : {"type": "keyword"},
                            "category": {"type": "keyword"},
                            "key"     : {"type": "keyword"},
                            "text"    : {"type": "keyword",
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
                                }},
                            "_id"     : {"type": "keyword"},
                            "loc"     : {"type": "keyword"},
                            "size"    : {"type": "keyword"},
                            "color"   : {"type": "keyword"},
                            "icon"    : {"type": "keyword"}
                        }
                    },
                    "linkDataArray": {
                        "type": "object",
                        "properties" : {
                            "from": {"type": "keyword"},
                            "to": {"type": "keyword"},
                            "text"  : {"type": "keyword"},
                            "points"  : {"type": "object",
                                "properties" :{
                                    "n" : {
                                        "type" : "object",
                                        "properties" : {
                                            "x" : {"type" : "float"},
                                            "y" : {"type" : "float"}
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "gene_relations"          : {"type": "keyword"},
                    "pubmed_relations"        : {"type": "keyword"},
                    "pathway_relations"       : {"type": "keyword"},
                    "author_relations"        : {"type": "keyword"},
                    "disease_relations"       : {"type": "keyword"},
                    "drug_relations"          : {"type": "keyword"},
                    "process_relations"       : {"type": "keyword"},
                    "anatomy_relations"       : {"type": "keyword"},
                    "organism_relations"      : {"type": "keyword"},
                    "enzyme_relations"        : {"type": "keyword"},
                    "collaborator_relations"  : {"type": "keyword"},
                    "collaborator_requests"   : {"type": "keyword"},
                    "gene_relations_count"    : {"type": "integer", "index": false, "doc_values": true},
                    "pathway_relations_count" : {"type": "integer", "index": false, "doc_values": true},
                    "drug_relations_count"    : {"type": "integer", "index": false, "doc_values": true},
                    "disease_relations_count" : {"type": "integer", "index": false, "doc_values": true},
                    "author_relations_count"  : {"type": "integer", "index": false, "doc_values": true},
                    "enzyme_relations_count"  : {"type": "integer", "index": false, "doc_values": true},
                    "organism_relations_count": {"type": "integer", "index": false, "doc_values": true},
                    "process_relations_count" : {"type": "integer", "index": false, "doc_values": true},
                    "anatomy_relations_count" : {"type": "integer", "index": false, "doc_values": true},
                    "pubmed_relations_count"  : {"type": "integer", "index": false, "doc_values": true},
                    "views"                   : {"type": "integer", "index": false, "doc_values": true},
                    "posts"                   : {"type": "integer", "index": false, "doc_values": true}
                }
            }
        }
    }
};

exports.database = 'elasticsearch';