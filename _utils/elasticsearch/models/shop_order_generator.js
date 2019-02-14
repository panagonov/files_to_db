let consts = require('../../../utilities/consts.js');

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
        "_id" : "32e9d93e-97e9-450d-9578-f3bed86e8a50",
        "counter" : 1
    }]
};

exports.database = 'elasticsearch';