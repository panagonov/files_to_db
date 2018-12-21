let str_to_json = (str) =>
{
    if (/^S'{/.test(str))
    {
        str = str.replace("S'", "").replace(/'\np0\n\.$/, "").replace(/\\r\\/g, " ").replace(/\\n/g, "").replace(/\\"/g, "'");
        str = str.replace(/\\u([0-9a-f]{4})/gi,
            function (whole, group1) {
                return String.fromCharCode(parseInt(group1, 16));
            });
        str = str.replace(/\\/g, "");
        try
        {
            return JSON.parse(str)
        }
        catch(e)
        {
            console.error(e);
            return null
        }
    }
    return null;
};

let clean_json = json =>
{
    let res = {};
    for(let key in json)
    {
        if (json.hasOwnProperty(key))
        {
            if (json[key] === null || json[key] === "")
                continue;
            if ((json[key] instanceof Array) && json[key].length === 0)
                continue;

            if (json[key] instanceof Object && !(json[key] instanceof Array) ) {
                res[key] = clean_json(json[key])
            }
            else {
                res[key] = json[key]
            }
        }
    }
    return res;
};

let transform_date = json =>
{
    for(let key in json)
    {
        if (json.hasOwnProperty(key))
        {
            if (json[key] instanceof Object && !(json[key] instanceof Array) ) {
                json[key] = transform_date(json[key]);
            }
            else if (/\sUTC\s\d{4}$/.test(json[key])) {
                json[key] = new Date(json[key])
            }
        }
    }
    return json;
};

module.exports = {
    str_to_json   : str_to_json,
    clean_json    : clean_json,
    transform_date: transform_date
};