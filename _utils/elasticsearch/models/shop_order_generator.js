let consts = require("./_analysis_resource/consts.js");

exports.schema =
{
    "title": "order_generator",
    "id" : "/OrderGenerator",
    "type": "object",
    "properties": {
        "_id": {"type": "string"},
        "counter": {"type": "integer"}
    }
};

exports.settings = {
    "index" : "gentaur-order-generator",
    "doc_type" : "order-no",
    "mapping": {
        "aliases": {
            "gentaur-order-generator": {}
        },
        "mappings": {
            "order-no": {
                "properties": {
                    "counter" : { "type" : "integer" }
                }
            }
        }
    }
};

exports.import_initial_data = {
    title : "order_generator",
    items : [{
        "_id" : consts.ORDER_GENERATOR_ID,
        "counter" : 1
    }]
};

exports.database = 'elasticsearch';