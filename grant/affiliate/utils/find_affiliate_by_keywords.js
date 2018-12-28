let forbidden_words        = require("../resources/forbidden_words_list.json");
let utils                  = require("../../../_utils/utils.js");
let transform_to_canonical = require("./transform_to_canonical.js");

let affiliates_word_hash = null;

let get_min_match_percent = (array_name) =>
{
    switch (array_name.length)
    {
        case 1:
        case 2:
        case 3:
            return 100;
        case 4:
        case 5:
            return 85;
        default:
            return 75
    }
};

let build_affiliates_word_hash = (affiliate_hash) =>
{
    if (affiliates_word_hash)
        return affiliates_word_hash;

    return Object.keys(affiliate_hash).reduce((res, normalize_name) =>
    {
        let name = name_to_array(normalize_name);

        name.forEach(word =>
        {
            res[word] = res[word] || [];
            res[word].push(normalize_name);
        });

        return res;
    }, {});
};

let name_to_array = (name) =>
    name.split(" ")
    .filter(word => word.length > 1)
    .filter(word => forbidden_words.indexOf(word) === -1)
    .reduce((res, word) => {
        if (res.indexOf(word) === -1)
            res.push(word);
        return res
    }, []);

let _is_match_new_affiliate_city = (aff_data, match, hash) =>
{
    if (aff_data.city && match.city)
    {
        let matched_city = aff_data.city
        .reduce((res, item) =>
        {
            if (item instanceof Array)
                res = res.concat(item);
            else
                res.push(item);
            return res;
        }, [])
        .filter(item => item && item.trim())
        .map(item =>  {
            let name = item.trim();
            let city =  transform_to_canonical.get_city(name, aff_data.country, hash) //todo check

            name = city ? city.name : name;
            return utils.normalize_string(name).trim()
        });

        let city = match.city.replace(" and ", ",").split(",")
        .reduce((res, item) => {
            res = res.concat(item.split("&")) ;
            return res;
        }, [])
        .map(item => utils.normalize_string(item).trim());

        return city.some(item => matched_city.indexOf(item) !== -1)
    }

    return true;
};

let _is_country_match = (aff_data, match, hash) => {
    if (aff_data.country && match.country)
    {
        let countries = typeof aff_data.country === "string" ? [aff_data.country] : aff_data.country;
        countries = countries.filter(country => country);

        for (let i = 0; i < countries.length; i++)
        {
            let country = countries[i];
            let country1 = hash.country[utils.normalize_string(country)];
            let country2 = hash.country[utils.normalize_string(match.country)];
            let canonical_country1 = country1.name;
            let canonical_country2 = country2.name;
            return canonical_country1 && canonical_country2 && canonical_country1 === canonical_country2;
        }

    }
    return true;
};

let is_need_to_execute = (aff_data) =>
{
    return !!aff_data.institution
};

let run = ({aff_data, hash}) =>
{
    if (!is_need_to_execute(aff_data))
        return aff_data;

    affiliates_word_hash = build_affiliates_word_hash(hash.affiliate);

    let found_affiliates = [];
    let not_found_institutions = [];

    aff_data.institution.forEach(unknown_institution_name =>
    {
        let normalize_name = utils.normalize_string(unknown_institution_name);
        let name = name_to_array(normalize_name);

        let matches = name.map(word => affiliates_word_hash[word])
        .filter(matches => matches)
        .sort((a,b) => a.length - b.length);

        let best_matches_list = matches.reduce((res, arr) =>
        {
            arr.forEach(item =>
            {
                res[item] = res[item] || 0;
                res[item] ++
            });
            return res
        }, {});

        let best_matches = Object.keys(best_matches_list)
        .sort((a,b) => best_matches_list[b] - best_matches_list[a])
        .map(key => ({key: key, count: best_matches_list[key]}))
        .filter((item,index,arr) =>  item.count === arr[0].count);

        let result = best_matches.reduce((res, item) =>
        {
            let hash_name = name_to_array(item.key);
            let match_name_percent =  100 * item.count /hash_name.length;
            let is_match_enough = match_name_percent >= get_min_match_percent(hash_name.length);
            if (is_match_enough) {
                item.word_diff_count = hash_name.length - name.length;
                res.push(item)
            }
            return res
        }, [])
        .filter(item => item.word_diff_count >= 0)
        .sort((a,b) => a.word_diff_count - b.word_diff_count)
        .filter((item,index,arr) =>  item.word_diff_count === arr[0].word_diff_count);

        let match_name_percent = result && result[0] ? 100 * result[0].count / name.length : 0;
        let is_match_enough = match_name_percent >= get_min_match_percent(name.length);
        let is_only_one_affiliate_match = result && result.length === 1;
        let found = is_match_enough && is_only_one_affiliate_match && _is_match_new_affiliate_city(aff_data, hash.affiliate[result[0].key], hash) && _is_country_match(aff_data, hash.affiliate[result[0].key], hash);

        found ? found_affiliates.push(result[0].key) : not_found_institutions.push(unknown_institution_name);
    });


    found_affiliates.length ?  aff_data.affiliate = [].concat(aff_data.affiliate ||[], found_affiliates) : null;

    not_found_institutions.length ? aff_data.institution = not_found_institutions : delete aff_data.institution;

    return aff_data;
};

module.exports = {
    run               : run,
    index             : 10,
    name              : "match_affiliate_by_keywords",
    disable           : false
};