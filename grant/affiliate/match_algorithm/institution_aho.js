let aho = require('./aho.js');

/**
 *
 * @param {Array} phrases
 * @param {String} phrases[0]
 */
let init = (phrases) => {
    let aho_match = aho.init(phrases);

    return {
        matchFn: (sequence) => {
            let result = [];
            let segments = sequence.split(",");
            segments.forEach(segment => {
                let match_result = aho_match.matchFn(segment);
                if (match_result.length)
                    result.push(segment.trim());
            });

            return result
        }
    }
};

module.exports = {
    init: init
};