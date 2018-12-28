let utils = require("../../../_utils/utils.js");
// let analyze_builder = require("./analyzer_builder.js");

// let match_type = analyze_builder.type().match;

let country_name_match_step = [
    (normalize_name, hash, analyzers) =>
    {
        return hash.country[normalize_name] || null;
    },

    (normalize_name, hash, analyzers) =>
    {
        let country_from_code_hash = hash.country_code[normalize_name];
        if (country_from_code_hash)
        {
            let country_name = utils.normalize_string(country_from_code_hash.name);
            return hash.country[country_name] || null;
        }
        return null;
    },

    (normalize_name, hash, analyzers) => {
        let result = [];
        if (!analyzers)
            debugger;
        let country_analyzers = analyzers.filter(item => item.field === "country");

        country_analyzers.forEach(({field, match}) => {
            let match_result = match.matchFn(normalize_name);
            if (match_result.length)
                result = result.concat(match_result);
        });

        let countries = result.map(country_name => hash.country[country_name.trim()]).sort((a,b) => a.priority || 2 - b.priority || 2);

        return countries[0] || null;
    }
];

let city_name_match_step = [
    (normalize_name, country, hash, analyzers) =>
    {
        let city = hash.city[normalize_name] || null;
        if (city && city.res && city.res.length === 1)
            return city.res[0];
        else if(city && city.res && city.res.length > 1 && country)
        {
            let res = city.res.filter(single_city =>
            {
                let city_country = hash.country_code[utils.normalize_string(single_city.country)];
                return utils.normalize_string(city_country) === utils.normalize_string(country_name(country, hash, analyzers))
            });
            if (res.length === 1)
                return res[0];
        }
        else if(city && city.res && city.res.length > 1 && !country)
        {
            let res = city.res.filter(({priority}) => !!priority);
            if (res.length === 1)
                return res[0];
        }
        return null
    },

    (normalize_name, country, hash, analyzers) =>
    {
        let result = [];
        let city_analyzers = analyzers.filter(item => item.field === "city");

        city_analyzers.forEach(({field, match}) => {
            let match_result = match.matchFn(normalize_name);
            if (match_result.length)
                result = result.concat(match_result);
        });

        let cities = result
        .filter(city_name => {
            if (!country)
                return true;
            return check_country_match(city_name, country, hash, analyzers)
        })
        .map(city_name => {
            let city = hash.city[city_name.trim()];
            if (city.res.length === 1)
                return city.res[0];
            return city.res.filter(city =>
            {
                let city_country = hash.country_code[city.country.toLowerCase()].name;
                return utils.normalize_string(city_country) === utils.normalize_string(country)
            }
            ).sort((a,b) => a.priority || 2 - b.priority || 2)[0];
        });
        return cities.sort((a,b) => a.priority || 2 - b.priority || 2)[0] || null;
    }
];

let check_country_match = (city, country, hash, analyzers) =>
{
    if (!country || !city)
        return true;

    let matched_cities = hash.city[utils.normalize_string(city)];

    let matched = false;

    if (matched_cities) {
        matched_cities.res.forEach(city =>
        {
            let city_country = hash.country_code[city.country.toLowerCase()].name;
            let normalize_country_name = utils.normalize_string(country_name(country, hash, analyzers));

            if (!hash.country[normalize_country_name])
            {
                console.error("MISSING Country:", country);
                return true;
            }

            !matched ? matched = utils.normalize_string(city_country) === normalize_country_name : null
        });
    }
    return matched
};

let country_name = (country, hash, analyzers) =>
{
    if (!country)
        return "";

    let country1 = utils.normalize_string(country
        .replace(/\d/g, "")
        .replace(/the\s/ig, "")
    );

    let country_result = "";

    for (let i = 0; i < country_name_match_step.length; i++)
    {
        country_result = country_name_match_step[i](country1, hash, analyzers);
        if (country_result)
            break;

    }
    if (!country_result)
    {
        console.error("Missing Country:", country);
        return "";
    }

    return  country_result.canonical ? hash.country[country_result.canonical].name : country_result.name
};

let get_city = (city_name, country, hash) =>
{
    let city = hash.city[utils.normalize_string(city_name.trim())];
    if (!city)
        return null;

    if (city.res.length === 1 && !country)
        return city.res[0];

    if (city.res.length > 1 && !country)
    {
        city.res = city.res.filter(({priority}) => !!priority);
        if (city.res.length === 1)
            return city.res[0]
        return null;
    }

    return city.res.filter(city =>
        {
            let city_country = hash.country_code[city.country.toLowerCase()].name;
            return utils.normalize_string(city_country) === utils.normalize_string(country)
        }
    ).sort((a,b) => a.priority || 2 - b.priority || 2)[0]
}

module.exports = {
    country_name:  country_name,

    city_name: (city, country, hash, analyzers) =>
    {
        if (!city)
            return "";

        if (city instanceof Array)
            city = city [0];

        city = city.replace(/\d/g, "");
        city = utils.normalize_string(city);

        let city_result = "";

        for (let i = 0; i < city_name_match_step.length; i++)
        {
            city_result = city_name_match_step[i](city, country, hash, analyzers);
            if (city_result)
                break;
        }

        if (!city_result)
        {
            console.error("MISSING City:", city);
            return ""
        }

        let city_name = city_result.canonical ? hash.city[city_result.canonical].name : city_result.name;


        if(check_country_match(utils.normalize_string(city_name), country, hash, analyzers))
        {
            return  city_name
        }

        return ""
    },

    affiliation_type : (aff_name, institution_hash) =>
    {
        let type_order = ["health", "educational", "government", "company"];
        let types = [];

        let result = match_type.matchFn(aff_name);

        result.forEach(word =>
        {
            let new_type = "";
            let is_known_institution_word = institution_hash[word];
            if (is_known_institution_word)
                new_type = is_known_institution_word.type;

            if (new_type && types.indexOf(new_type) === -1)
                types.push(new_type)
        });

        types = types.sort((a,b) => type_order.indexOf(a) - type_order.indexOf(b));

        return types[0] || "";
    },

    get_city
};