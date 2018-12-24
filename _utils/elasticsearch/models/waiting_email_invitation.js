exports.schema =
    {
        "title": "waiting_email_invitation",
        "type": "object",
        "properties": {
            "_id"         : {"type": "string"},
            "channel_data": {"type": "object", "additionalProperties" : true},
            "user_from"   : {"type": "object", "additionalProperties" : true},
            "user_to"     : {"type": "object", "additionalProperties" : true},
            "message_id"  : {"type": "string"}
        }
    };

exports.settings = {
    "index": "bioseek-waiting_email_invitation",
    "doc_type": "waiting_email_invitation",
    "user_data": true,
    "mapping": {
        "aliases": {
            "bioseek-waiting_email_invitation": {}
        },
        "settings": {
        },
        "mappings": {
            "waiting_email_invitation": {
                "properties": {
                    "channel_data": {"enabled": false},
                    "user_from"   : {"enabled": false},
                    "user_to"     : {"enabled": false},
                    "message_id"  : {"enabled": false}
                }
            }
        }
    }
};