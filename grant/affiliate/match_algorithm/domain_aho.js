/**
 *
 * @param {Array} phrases
 * @param {String} phrases[0]
 */
let init = (phrases) => {
    return {
        matchFn: (sequence) => {
            let result = [];

            let regexp = /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/gim;
            let match;
            let last_index = null;
            do {
                match = regexp.exec(sequence);

                if (!match)
                    break;
                if (match && match.index === last_index)
                    break;

                last_index = match.index;
                let email = match[0].toLowerCase();
                let domain = email.split("@").pop();

               result.push(domain)
            }while(match);

            return result
        }

    };
};

module.exports = {
    init: init
};