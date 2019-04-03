let run = async(text, phrases) =>
{
    let words = phrases
    .map(word => word.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&").trim())
    .sort((a,b) => b.length - a.length);

    let regStr = "(^|\\s|\\W)("+ words.join("|") + ")($|\\s|\\W)";

    let regEx = new RegExp(regStr, "gim");
    let result = [];
    let matches;
    do
    {
        matches = regEx.exec(text);
        if (matches)
        {
            let index =  matches[1] && /\s|\W/.test(matches[1]) ?  matches.index + 1 : matches.index;
            result.push({match: matches[2], index})
        }
    } while(matches);

    return result
};

module.exports = {
    run
};


// run(
// "  MF011-20PT",
// ["MF011-20PT"])
// .then(() => process.exit(0))
// .catch(e => console.error(e));
