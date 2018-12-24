    //order_no : 4560012,
    //status: 1,
    //date_created: new Date(),
    //date_shipped: new Date(),
    //sub_total: 0,
    //shipping: 0,
    //total : 0,
    //currency: "$",
    //items : [

let order_status = ['in review', 'send invoice', 'refund all', 'refund partially', "mark as payed", "remind", "cancel", 'close'];
exports.lookups = [order_status];

exports.schema =
{
    "title": "order",
    "id" : "/Order",
    "type": "object",
    "properties": {
        "_id" : { "type" : "string" },
        "order_no" : { "type" : "string" },
        "user" : {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "name": {"type": "string"},
                "email": {"type": "string"},
                "image": {"type": "string"}
            }
        },
        "invoice_id" : { "type" : "string" },
        "status" : {
            "enum" : order_status
        },
        "date_created": { "type": "string", "format" : "date-time" },
        "date_shipped": { "type": "string", "format" : "date-time" },
        "sub_total": { "type" : "number", "minimum" : 0 },
        "shipping" : { "type" : "number"},
        "total": { "type" : "number", "minimum" : 0 },
        "currency" : { "type" : "string"},
        "order_lines" : {
            "type" : "array",
            "items" : {
                "$ref": "/OrderLine"
            }
        }
    },
    "required" : ["user_id"],
    "additionalProperties" : false
};

exports.schema_dependencies = [
    { id: '/OrderLine', title : 'order_line' }
];

exports.settings = {
    "index" : "gentaur-orders",
    "doc_type" : "order",
    "user_data" : true,
    "mapping": {
        "aliases": {
            "gentaur-orders": {}
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
                    "order_no" : {"type": "keyword"},
                    "user": {
                        "type" : "object",
                        "properties" : {
                            id : {"type": "keyword"},
                            name: { "type" : "keyword" },
                            email : { "type" : "keyword"},
                            image : { "type" : "keyword"}
                        }
                    },
                    "invoice_id" : { "type" : "keyword" },
                    "date_created": { "type": "date"},
                    "date_shipped": { "type": "date"},
                    "sub_total": { "type" : "long"},
                    "shipping" : { "type" : "long"},
                    "total": { "type" : "long"},
                    "currency" : { "type" : "keyword"},
                    "order_lines": {
                        "type": "object",
                        "properties": {
                            "product_id" : {"type": "keyword"},
                            "user_id": {"type": "keyword"},
                            "name": { "type": "text", "analyzer": "whitelowercase" },
                            "price": { "type" : "long"},
                            "amount" : { "type" : "long"},
                            "size" : { "type" : "keyword"}
                        }
                    }
                }
            }
        }
    }
};

exports.database = 'elasticsearch';