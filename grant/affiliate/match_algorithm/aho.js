let AhoCorasick = require('node-aho-corasick');
let utils   = require("../../../_utils/utils.js");

/**
 *
 * @param {Array} phrases
 * @param {Function} [transform_fn]
 * @param {String} phrases[0]
 */
let init = (phrases, transform_fn) => {
    let ac = new AhoCorasick();
    transform_fn = transform_fn || utils.normalize_string;

    phrases = phrases.sort((a,b) => b.length - a.length);

    phrases.forEach((phrase) => 
        ac.add(' ' + transform_fn(phrase) + ' ')
    );

    ac.build();

    return {
        matchFn: (sequence) =>
        {
           let result = ac.search(' ' + transform_fn(sequence)+ ' ');
           return result.map(item => item.trim())
        }
    };
};

module.exports = {
    init: init
};