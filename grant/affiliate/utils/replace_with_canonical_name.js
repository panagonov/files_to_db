let transform_to_canonical = require("../utils/transform_to_canonical.js");

let is_need_to_execute = (aff_data) =>
{
    return true;
};

let run = ({aff_data, hash}) =>
{
    if (aff_data.city)
    {
        aff_data.city = aff_data.city.map(city =>
        {
            let name = city.trim();
            let city_from_hash = transform_to_canonical.get_city(city, aff_data.country, hash); //todo check
            return city_from_hash ? city_from_hash.name : name;
        })
    }
    if (aff_data.country)
    {
        aff_data.country = aff_data.country.map(country =>
            hash.country[country.trim()] ? hash.country[country.trim()].name : country.trim())
    }
    if (aff_data.affiliate)
    {
        aff_data.affiliate = aff_data.affiliate.map(affiliate =>
            hash.affiliate[affiliate.trim()]._id)
    }
    return aff_data
};

module.exports = {
    is_need_to_execute: is_need_to_execute,
    run               : run,
    index             : 80,
    name              : "replace_with_canonical_name",
    disable           : false
};