let directory_reader = require("../../../_utils/directory_reader.js");

let match_algorithm = directory_reader(`${__dirname}/../match_algorithm/`, "js");
let main_resources  = directory_reader(`${__dirname}/../resources/`, "json");

let country = input_resources => {
    let resources = input_resources || main_resources;
    let countries = resources.country_list.reduce((res, {name, synonyms}) => {
        res.push(name);
        if (synonyms)
            res = res.concat(synonyms);
        return res;
    }, []);

    return {field: "country", match: match_algorithm.aho.init(countries)};
};

let city = input_resources => {
    let resources = input_resources || main_resources;
    let cities    = resources.city_list.reduce((res, {name, synonyms}) => {
        res.push(name);
        if (synonyms)
            res = res.concat(synonyms);
        return res;
    }, []);

    return {field: "city", match: match_algorithm.aho.init(cities)};
};

let affiliate = input_resources => {
    let resources  = input_resources || main_resources;
    let affiliates = resources.affiliates_list.map(({name}) => name);

    return {field: "affiliate", match: match_algorithm.aho.init(affiliates)};
};

let domain = input_resources => {
    let resources = input_resources || main_resources;

    let domains = resources.affiliates_list.reduce((res, {domains}) => res.concat(domains), []);
    for (let key in resources.affiliate_domain_synonyms)
        if (resources.affiliate_domain_synonyms.hasOwnProperty(key))
            domains = domains.concat(resources.affiliate_domain_synonyms[key]);

    return {field: "domain", match: match_algorithm.domain_aho.init(domains)};
};

let institution = input_resources => {
    let resources   = input_resources || main_resources;
    let institution = resources.institution_keywords_list.map(item => item.name);

    return {field: "institution", match: match_algorithm.institution_aho.init(institution)};
};

let type = input_resources => {
    let resources   = input_resources || main_resources;
    let institution = resources.institution_keywords_list.map(item => item.name);

    return {field: "type", match: match_algorithm.institution_type_aho.init(institution)};
};

let all = input_resources => {
    let resources = input_resources || main_resources;
    return [
        country(resources),
        city(resources),
        // affiliate(resources),
        domain(resources),
        institution(resources)
    ];
};

module.exports = {
    country    : country,
    city       : city,
    affiliate  : affiliate,
    domain     : domain,
    institution: institution,
    type       : type,
    all        : all
};

