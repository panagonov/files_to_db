let unidecode = require("unidecode");

let getValueFromJSON = (jsn, key) =>
{
    if (!key)
    {
        return jsn;
    }
    let parseData = key.split('.');

    if (parseData[parseData.length - 1] === "" && parseData[parseData.length - 2])
    {
        parseData[parseData.length - 2] += ".";
        parseData.pop()
    }

    let currentKey = parseData[0];
    if (!jsn || !jsn.hasOwnProperty(currentKey))
    {
        return null;
    }

    if (parseData.length === 1)
    {
        return jsn[currentKey];
    }

    parseData.shift();
    return getValueFromJSON(jsn[currentKey], parseData.join('.'))
};

let mapping_transform = (mapping, record) =>
{
    let result = {};
    for(let key in mapping)
    {
        if(typeof mapping[key] === "function") {
            let res = mapping[key](record);
            if (res || res === 0) {
                result[key] = res
            }
        }
        else if (typeof mapping[key] === "string") {
            let res = getValueFromJSON(record, mapping[key]);
            res ? result[key] = res : null
        }
        else if (mapping[key] instanceof Array ) {
            for(let i = 0; i < mapping[key].length; i++)
            {
                let res = getValueFromJSON(record, mapping[key][i]);
                if (res || res === 0)
                {
                    result[key] = res;
                    break;
                }
            }
        }
    }
    return result;
};

let wait = async(delay) =>
    new Promise((resolve, reject) => {
        setTimeout(resolve, delay)
    });

let uniq = (arr, fn) =>
{
    let result = arr.reduce((res, item) =>
    {
        let key = fn ? fn(item) : item;
        res[key] = item;
        return res
    }, {});

    return Object.keys(result).map(key => result[key])
};

let normalize_string = (str) => {
    if (!str || !str.replace)
        str = "";
    return unidecode(str).replace(/\W/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
};

let get_node_type = (node) =>
{
    if (node._type === "drug_or_chemical")
    {
        return "drug";
    }

    return node._type || "";
};

let capitalizeFirstLetter = (string) =>
{
    return string.charAt(0).toUpperCase() + string.slice(1);
};

let objEach = (obj, callback) => {
    let counter = 0;
    for (let key in obj)
    {
        if ( obj.hasOwnProperty(key) )
        {
            callback( key, obj[key], counter );
        }
        counter ++;
    }
};

let isEmptyObj = (obj) =>
{
    for(let prop in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
            return false;
        }
    }
    return true;
};

let format = function(str) //in arrow function arguments not working!!!
{
    for( let i = 1; i < arguments.length; i++ )
    {
        let regexp = new RegExp( '\\{' + (i - 1) + '\\}', 'gim' );
        str = str.replace( regexp, arguments[i] );
    }
    return str;
};

let addZero = (value, symbol_count, symbol = "0") =>
{
    value = value.toString();
    let start_length = value.length;

    for (let i = start_length; i < symbol_count; i++)
        value =  symbol + value;
    return value;
};

module.exports = {
    mapping_transform,
    wait,
    uniq,
    normalize_string,
    get_node_type,
    capitalizeFirstLetter,
    objEach,
    isEmptyObj,
    format,
    addZero
};