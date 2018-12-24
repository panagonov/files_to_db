exports.schema =
{
    "title": "chat",
    "type": "object",
    "properties": {
        "_id" : { "type" : "string" },
        "chat_channel" : { "type" : "string" },
        "date_created": {
            "type": "string",
            "format": "date-time"
        },
        "date_updated": {
            "type": "string",
            "format": "date-time"
        },
        "message" : { "type" : "string" },
        "type" : { "enum" : [
                "invite_to_chat_list",
                "invite_to_chat_list_accepted",
                "invite_to_chat_list_rejected",
                "invite_to_chat_group",
                "invite_to_chat_group_accepted",
                "invite_to_chat_group_rejected",
                "remove_from_chat_list",
                "removed_from_chat_group",
                "remove_collaborator",
                "invite_collaborator",
                "invite_collaborator_accepted",
                "invite_collaborator_rejected",
                "collaborator_accepted_invitation",
                "collaborator_rejected_invitation",
                "collaborator_leave_chat_group",
                "mentioned_user",
                "file"
            ] },
        "from" : {
            "type": "object",
            "properties" : {
                "name" : {
                    "type" : "string"
                },
                "primary_email" : {
                    "type" : "string",
                    "format" : "email"
                },
                "_id" : {
                    "type" : "string"
                },
                "image" : {
                    "type" : "string"
                }
            }
        },
        "system_data" : {
            "type": "object",
            "additionalProperties" : true
        },
        "attachments": {
            "type" : "array",
            "items": [
                {
                    "type": "object",
                    "properties" : {
                        "_id"        : {"type": "string"},
                        "name"       : {"type": "string"},
                        "description": {"type": "string"},
                        "type"       : {"type": "string"},
                        "preview_url": {"type": "string"},
                        "preview"    : {"type": "boolean"},
                        "size"       : {"type": "integer"}
                    }
                }
            ]
        },
        "status" : {"enum" : [
            "sending",
            "sent",
            "delivered",
            "seen",
            "error",
            ]},
        "rel_version" : {"type" : "number"}
    },
    "additionalProperties" : false
};

exports.settings = {
    "index" : "gentaur-chat",
    "doc_type" : "chat",
    "mapping": {
        "aliases": {
            "gentaur-chat": {}
        },
        "settings": {
            "analysis": {
                "char_filter": {
                    "my_char_filter": {
                        "type"       : "pattern_replace",
                        "pattern"    : "([\.|\,|\!])",
                        "replacement": " "
                    }
                },
                "filter": {
                    "autocomplete_filter": {
                        "type"    : "ngram",
                        "min_gram": 2
                    },
                    "edge_filter": {
                        "type"    : "edge_ngram",
                        "min_gram": 2,
                        "max_gram": 10
                    }
                },
                "analyzer": {
                    "whitelowercase": {
                        "type": "custom",
                        "tokenizer": "whitespace",
                        "filter": ["lowercase"]
                    },
                    "autocomplete": {
                        "type": "custom",
                        "tokenizer": "whitespace",
                        "filter": ["lowercase", "autocomplete_filter"]
                    },
                    "edge_analyzer": {
                        "type": "custom",
                        "tokenizer": "whitespace",
                        "filter": ["lowercase", "edge_filter"]
                    }

                }
            }
        },
        "mappings": {
            "chat": {
                "properties": {
                    "chat_channel": { "type": "keyword"},
                    "date_created": {"type": "date"},
                    "date_updated": {"type": "date"},
                    "message": {
                        "type": "text",
                        "analyzer" : "edge_analyzer",
                        "search_analyzer": "standard"
                    },

                    "from" : {
                        "type" : "object",
                        "properties": {
                            "name":  {"type": "text", "analyzer" : "edge_analyzer", "search_analyzer": "standard"},
                            "primary_email":  {
                                "type": "keyword",
                                "fields" : {
                                    "search" :{
                                        "type" : "text",
                                        "analyzer" : "edge_analyzer"
                                    }
                                }
                            },
                            "_id": {
                                "type": 'keyword',
                            },
                            "image": {
                                "type": 'text'
                            }
                        }
                    },
                    "attachments": {
                        "type"      : "object",
                        "properties": {
                            "name": {
                                "type"    : 'text',
                                "analyzer": 'autocomplete'
                            },
                            "description" :  {
                                "type"    : 'text',
                                "analyzer": 'autocomplete'
                            },
                            "type": {
                                "type": 'keyword',
                            },
                            "_id" : {
                                "type": 'keyword',
                            },
                            "preview": {
                                "type": 'keyword'
                            },
                            "preview_url": {
                                "type": 'keyword'
                            },
                            "size": {
                                "type": 'integer'
                            }
                        }
                    },
                    "status" : {
                        "type": 'keyword',
                    }
                }
            }
        }
    }
};

exports.database = 'elasticsearch';