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

module.exports = {
    mapping_transform,
    wait
};