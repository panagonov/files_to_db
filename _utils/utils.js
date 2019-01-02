let unidecode = require("unidecode");

let mapping_transform = (mapping, record) =>
{
    let result = {};
    for(let key in mapping)
    {
        if(typeof mapping[key] === "function") {
            let res = mapping[key](record);
            if (res || res === 0) {
                result[key] = mapping[key](record)
            }
        }
        else if (typeof mapping[key] === "string" && record[mapping[key]]) {
            result[key] = record[mapping[key]]
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
    if(!fn)
    {
        let result = arr.reduce((res, item) =>
        {
            res[item] = item;
            return res
        }, {});

        return Object.keys(result).map(key => result[key])
    }
    else
    {
        return fn(arr)
    }
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

module.exports = {
    mapping_transform,
    wait,
    uniq,
    normalize_string,
    get_node_type
};