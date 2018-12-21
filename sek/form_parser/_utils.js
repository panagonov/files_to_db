let parser = require("xml2json")

let xml_to_json = (text) => {
    let xml_data = /\<XML\>((.|\n|\r)+)\<\/XML\>/gim.exec(text)[1].replace(/\n/g, "");
    return parser.toJson(xml_data, {object: true});
};

let text_to_json = (text) => {
    let important_text_part = /\<SEC-HEADER\>((.|\n|\r)+)\<\/SEC-HEADER\>/gim.exec(text)[1];
    let text_array = important_text_part.split("\n").filter(txt => txt.indexOf(":") !== -1 && txt.indexOf("\t") !== -1 );
    text_array = text_array.map(txt => txt.replace(/^\t+/, "").replace(/\t+$/, "").replace(/\t+/g, "\t").split("\t"));

    let result = {};
    let parent = "";

    text_array.forEach(part =>
    {
        if (part.length === 2)
        {
            let key = [parent, part[0].trim().replace(/\:$/, "")].filter(item => item).join(".");
            setKeyInJSON(result, key, part[1].trim())
        }
         else if(part.length === 1)
            parent = part[0].trim().replace(/\:$/, "")
    });

    return result
};

let getValueFromJSON = (jsn, key) => {
    if (!key) {
        return jsn;
    }
    let parseData  = key.split('.');
    let currentKey = parseData[0];
    if (!jsn || !jsn.hasOwnProperty(currentKey)) {
        return null;
    }

    if (parseData.length === 1) {
        return jsn[currentKey];
    }

    parseData.shift();
    return getValueFromJSON(jsn[currentKey], parseData.join('.'));
};

let setKeyInJSON = (jsn, key, value) => {
    if (!key) {
        return;
    }
    let parseData  = key.split('.');
    let currentKey = parseData[0];
    let nextKey    = parseData[1];
    let isArray    = parseInt(nextKey, 10) == nextKey;

    if (!jsn.hasOwnProperty(currentKey)) {
        if (isArray) {
            jsn[currentKey] = [];
        }
        else {
            jsn[currentKey] = {};
        }
    }

    if (parseData.length === 1) {
        return jsn[currentKey] = value;
    }

    parseData.shift();
    return setKeyInJSON(jsn[currentKey], parseData.join('.'), value);
};

module.exports = {
    xml_to_json     : xml_to_json,
    text_to_json    : text_to_json,
    getValueFromJSON: getValueFromJSON,
    setKeyInJSON    : setKeyInJSON
};