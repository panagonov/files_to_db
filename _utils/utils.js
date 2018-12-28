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
        return arr.reduce((res, item) =>
        {
            if (res.indexOf(item) === -1)
                res.push(item);
            return res
        }, []);
    }
    else
    {
        return fn(arr)
    }
};

module.exports = {
    mapping_transform,
    wait,
    uniq
};