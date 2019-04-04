let domain_hash = {};

/**
 *
 * @param {String} domain_name
 * @param {Object} data - hash of data ids.toLowerCase() = [{}, {}]
 * @returns {Promise<void>}
 */
let add_domain = (domain_name, data) => {
    let words = Object.keys(data)
    .map(word => word.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&").trim())
    .sort((a,b) => b.length - a.length);

    let regStr = "(^|\\s|\\W)("+ words.join("|") + ")($|\\s|\\W)";

    domain_hash[domain_name] = {
        data: data,
        regStr: regStr
    }
};

let run = (text, domain_name) =>
{
    if (!domain_hash.hasOwnProperty(domain_name)){
        let err = `Missing domain - ${domain_name}`;
        console.error("Small Petko error:", err);
        return {success: false, result : [], error: err}
    }

    let regEx = new RegExp(domain_hash[domain_name].regStr, "gim");
    let result = [];
    let matches;
    do
    {
        matches = regEx.exec(text);
        if (matches)
        {
            let index =  matches[1] && /\s|\W/.test(matches[1]) ?  matches.index + 1 : matches.index;
            let match = matches[2];
            result.push({originalText: match, start_pos: index, length: match.length, terms: domain_hash[domain_name].data[match.toLowerCase()]})
        }
    } while(matches);

    return {success: true, result, error: null}
};

module.exports = {
    run,
    add_domain
};

// run(
// "  MF011-20PT",
// "himedia_laboratories")
// .then(() => process.exit(0))
// .catch(e => console.error(e));