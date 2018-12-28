let utils            = require("../../../_utils/utils.js");
let directory_reader = require("../../../_utils/directory_reader.js");

let main_resources = directory_reader(`${__dirname}/../resources/`, "json");

let domain = input_resources => {

    let resources = input_resources || main_resources;
    if (!resources.affiliates_list || !resources.affiliate_domain_synonyms)
        return {};

    return resources.affiliates_list.reduce((res, affiliate) => {
        (affiliate.domains || []).forEach(domain => {
            if (res[domain])
                console.error("Duplicate domain:", domain);
            res[domain] = affiliate;
        });

        let synonyms = resources.affiliate_domain_synonyms[affiliate._id];
        (synonyms || []).forEach(domain => {
            if (res[domain])
                console.error("Duplicate domain:", domain);
            res[domain] = affiliate;
        });
        return res;
    }, {});
};

let ignore_domain = input_resources => {
    let resources = input_resources || main_resources;
    if (!resources.ignore_domains_list || !resources.public_domains_list)
        return {};

    return resources.ignore_domains_list.concat(resources.public_domains_list).reduce((res, domain) => {
        res[domain] = 1;
        return res;
    }, {});
};

let affiliate = input_resources => {
    let resources = input_resources || main_resources;
    if (!resources.affiliates_list)
        return {};

    return resources.affiliates_list.reduce((res, affiliate) => {
        let canonical_name = utils.normalize_string(affiliate.name);
        // if (res[canonical_name])
        //     console.error("Duplicate affiliate name:", canonical_name);
        res[canonical_name] = affiliate;

        (affiliate.aliases || []).forEach(synonym => {
            let name = utils.normalize_string(synonym);
            // if (res[name])
            //     console.error("Duplicate affiliate name:", name);
            res[name] = Object.assign({canonical: canonical_name}, affiliate);
        });

        let synonyms = (resources.affiliates_synonyms || {})[affiliate._id];
        (synonyms || []).forEach(domain => {
            // if (res[domain])
            //     console.error("Duplicate domain:", domain);
            res[domain] = affiliate;
        });
        return res;
    }, {});
};

let city = input_resources => {
    let resources = input_resources || main_resources;
    if (!resources.city_list)
        return {};

    return resources.city_list.reduce((res, city) => {
        let canonical_name = utils.normalize_string(city.name);
        res[canonical_name] = res[canonical_name] || {res : []};
        res[canonical_name].res.push(city);
        (city.synonyms || []).forEach(synonym => {
            let name = utils.normalize_string(synonym);
            res[name] = res[name] || {res : [], canonical: canonical_name};

            res[name].res.push(city);
        });
        return res;
    }, {});
};

let country = input_resources => {
    let resources = input_resources || main_resources;
    if (!resources.country_list)
        return {};

    return resources.country_list.reduce((res, country) => {
        let canonical_name  = utils.normalize_string(country.name);
        res[canonical_name] = country;

        (country.synonyms || []).forEach(synonym => {
            let name  = utils.normalize_string(synonym);
            res[name] = Object.assign({canonical: canonical_name}, country);
        });
        return res;
    }, {});
};

let country_code = input_resources => {
    let resources = input_resources || main_resources;
    if (!resources.country_list)
        return {};

    return resources.country_list.reduce((res, country) => {
        res[utils.normalize_string(country.code)] = country;
        return res;
    }, {});
};

let institution = input_resources => {
    let resources = input_resources || main_resources;
    if (!resources.institution_keywords_list)
        return {};

    return resources.institution_keywords_list.reduce((res, institution) => {
        res[utils.normalize_string(institution.name)] = institution;
        return res;
    }, {});
};

let from_array_of_strings = arr => {
    return arr.reduce((res, item) => {
        res[item] = item;
        return res;
    }, {});
};

let all = input_resources =>
{
    let resources = input_resources || main_resources;
    return {
        country      : country(resources),
        country_code : country_code(resources),
        city         : city(resources),
        affiliate    : affiliate(resources),
        domain       : domain(resources),
        ignore_domain: ignore_domain(resources),
        institution  : institution(resources)
    };
}

module.exports = {
    domain               : domain,
    ignore_domain        : ignore_domain,
    affiliate            : affiliate,
    city                 : city,
    country              : country,
    country_code         : country_code,
    institution          : institution,
    from_array_of_strings: from_array_of_strings,
    all: all
};