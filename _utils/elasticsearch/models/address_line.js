exports.schema =
{
    "title": "address_line",
    "id" : "/AddressLine",
    "type": "object",
    "properties": {
        "first_name" : {"type": "string"},
        "last_name"  : {"type": "string"},
        "company"    : {"type": "string"},
        "address"    : {"type": "string"},
        "city"       : {"type": "string"},
        "postal_code": {"type": "string"},
        "country"    : {"type": "string"},
        "state"      : {"type": "string"},
        "phone"      : {"type": "string"}
    },
    "required" : ["first_name", "last_name", "company", "address", "city", "country", "phone"],
    "additionalProperties" : false
};