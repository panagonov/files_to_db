exports.schema =
    {
        "title"               : "author_affiliation",
        "type"                : "object",
        "properties"          : {
            "_id"              : {"type": "string"},
            "pubmed_id"        : {"type": "string"},
            "author_id"        : {"type": "string"},
            "affiliation_info" : {"type": "string"},
            "affiliation_words": {
                "type": "array", "items": {"type": "string"}
            }
        },
        "additionalProperties": false
    };

exports.settings = {
    "index"   : "bioseek-author_affiliation",
    "doc_type": "author_affiliation",
    "mapping" : {
        "aliases" : {
            "bioseek-author_affiliation": {}
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
                "analyzer": {
                    "lowercase_whitespace": {
                        "type"     : "custom",
                        "char_filter": ["my_char_filter"],
                        "tokenizer": "whitespace",
                        "filter"   : ["lowercase"]
                    }
                }
            }
        },
        "mappings": {
            "author_affiliation": {
                "properties": {
                    "pubmed_id"        : {"type": "keyword"},
                    "author_id"        : {"type": "keyword"},
                    "affiliation_info" : {
                        "type"  : "keyword",
                        "fields": {
                            "suggest": {
                                "type"           : "text",
                                "analyzer"       : "lowercase_whitespace",
                                "search_analyzer": "lowercase_whitespace"
                            }
                        }
                    },
                    "affiliation_words": {"type": "keyword", "doc_values": true}
                }
            }
        }
    }
};

exports.database = 'elasticsearch';