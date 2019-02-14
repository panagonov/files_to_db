let shop_model   = require("./_analysis_resource/shop_model.json");
let order_status = ['in review', 'send invoice', 'refund all', 'refund partially', "mark as payed", "remind", "cancel", 'close'];
exports.lookups  = [order_status];

exports.schema =
{
    "title"               : "order",
    "id"                  : "/Order",
    "type"                : "object",
    "properties"          : {
        "_id"             : {"type": "string"},
        "order_no"        : {"type": "string"},
        "user"            : {
            "type"      : "object",
            "properties": {
                "id"   : {"type": "string"},
                "name" : {"type": "string"},
                "email": {"type": "string"},
                "image": {"type": "string"}
            }
        },
        "invoice_id"      : {"type": "string"},
        "status"          : {
            "enum": order_status
        },
        "date_created"    : {"type": "string", "format": "date-time"},
        "date_updated"    : {"type": "string", "format": "date-time"},
        "payed"      : {
            "type" : "array",
            "items" : {
                "type" : "object",
                "properties": {
                    "date" : {"type": "string", "format": "date-time"},
                    "price": {
                        "type" : "object",
                        "properties" : {
                            "value"   : {"type": "number"},
                            "currency": {"type": "string"}
                        }
                    }
                }
            }

        },
        "shipped"    : {
            "type" : "array",
            "items" : {
                "type" : "object",
                "properties": {
                    "date" : {"type": "string", "format": "date-time"},
                    "items" : {
                        "type" : "array",
                        "items" : {
                            "type" : "string"
                        }
                    }
                }
            }

        },
        "delivered"    : {
            "type" : "array",
            "items" : {
                "type" : "object",
                "properties": {
                    "date" : {"type": "string", "format": "date-time"},
                    "items" : {
                        "type" : "array",
                        "items" : {
                            "type" : "string"
                        }
                    }
                }
            }

        },
        "sub_total"       : {"type": "number", "minimum": 0},
        "sub_total_format": {"type": "string"},
        "shipping"        : {"type": "number"},
        "shipping_format" : {"type": "string"},
        "total"           : {"type": "number", "minimum": 0},
        "total_format"    : {"type": "string"},
        "currency"        : {"type": "string"},
        "region"          : {"type": "string"},
        "distributor_id"  : {"type": "string"},
        "distributor"     : {"type": "string"},
        "order_lines"     : {
            "type" : "array",
            "items" : {
                "type"      : "object",
                "properties": {
                    "product_id"         : {"type": "string"},
                    "distributor_id"     : {"type": "string"},
                    "catalog_no"         : {"type": "string"},
                    "type"               : {"type": "string"},
                    "name"               : {"type": "string"},
                    "amount"             : {"type": "integer"},
                    "size"               : {"type": "string"},
                    "single_price"       : {"type": "float"},
                    "single_price_format": {"type": "string"},
                    "price"              : {"type": "float"},
                    "price_format"       : {"type": "string"},
                    "link"               : {"type": "string"},
                    "product_size_index" : {"type": "integer"}
                }
            }
        }
    },
    "required"            : ["user_id"],
    "additionalProperties": false
};

exports.schema_dependencies = [
    { id: '/OrderLine', title : 'order_line' }
];

exports.settings = {
    "index" : "shop_order",
    "doc_type" : "order",
    "user_data" : true,
    "mapping": {
        "aliases": {
            "shop_order": {}
        },
        "settings": {
            "analysis": {
                "analyzer": {
                    "whitelowercase": {
                        "type": "custom",
                        "tokenizer": "whitespace",
                        "filter": ["lowercase"]
                    }
                }
            }
        },
        "mappings": {
            "order": {
                "properties": {
                    "order_no"        : {"type": "keyword"},
                    "user"            : {
                        "type"      : "object",
                        "properties": {
                            "id"   : {"type": "keyword"},
                            "name" : {"type": "keyword"},
                            "email": {"type": "keyword"},
                            "image": {"type": "keyword"}
                        }
                    },
                    "invoice_id"      : {"type": "keyword"},
                    "date_created"    : {"type": "date"},
                    "payed"      : {
                        "type": "object",
                        "properties" : {
                            "date" : {"type" : "date"},
                            "price": {
                                "type" : "object",
                                "properties" : {
                                    "value"   : {"type": "float"},
                                    "currency": {"type": "keyword"}
                                }
                            }
                        }
                    },
                    "shipped"    : {
                        "type": "object",
                        "properties" : {
                            "date" : {"type" : "date"},
                            "items": {"type" : "keyword"}
                        }
                    },
                    "delivered"    : {
                        "type": "object",
                        "properties" : {
                            "date" : {"type" : "date"},
                            "items": {"type" : "keyword"}
                        }
                    },
                    "sub_total"       : {"type": "long"},
                    "sub_total_format": {"type": "keyword"},
                    "shipping"        : {"type": "long"},
                    "shipping_format" : {"type": "keyword"},
                    "total"           : {"type": "long"},
                    "total_format"    : {"type": "keyword"},
                    "region"          : {"type": "keyword"},
                    "distributor_id"  : {"type": "keyword"},
                    "distributor"     : {"type": "keyword"},
                    "order_lines"     : {
                        "type"      : "object",
                        "properties": {
                            "product_id"         : {"type": "keyword"},
                            "distributor_id"     : {"type": "keyword"},
                            "catalog_no"         : {"type": "keyword"},
                            "type"               : {"type": "keyword"},
                            "name"               : {"type": "text", "analyzer": "whitelowercase"},
                            "amount"             : {"type": "integer"},
                            "size"               : {"type": "keyword"},
                            "single_price"       : {"type": "float"},
                            "single_price_format": {"type": "keyword"},
                            "price"              : {"type": "float"},
                            "price_format"       : {"type": "keyword"},
                            "link"               : {"type": "keyword"},
                            "product_size_index" : {"type": "integer"}
                        }
                    }
                }
            }
        }
    }
};

exports.database = 'elasticsearch';