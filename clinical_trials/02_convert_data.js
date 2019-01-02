let _                 = require('underscore');
let human_name_parser = require('humanparser');
let Mongo_db = require("../_utils/db");

let mongo_db;
let limit = 1000;
let version = 1;

let init_dbs = async() =>
{
    mongo_db = new Mongo_db();
    await mongo_db.init("clinical_trails");
    await mongo_db.create_index("original", {data: {version: 1}})
};

let obj_to_array = (obj) => !(obj instanceof Array) ? obj ? [obj] : null : obj;

/**
 *
 * @param {Object} item
 * @param {Object|Array} item.location
 * @param {String} item.location.facility
 * @param {String} item.location.address
 * @returns {*}
 * @private
 */
let _get_facilities = (item) =>
{
    if (!item.location)
        return null;

    let location = obj_to_array(item.location);

    return location.map(({facility}) => {
        return {
            ...facility.name ? {name: facility.name} : "",
            ...facility.address && facility.address.city ? {city: facility.address.city} : "",
            ...facility.address && facility.address.state ? {state: facility.address.state} : "",
            ...facility.address && facility.address.zip ? {zip: facility.address.zip} : "",
            ...facility.address && facility.address.country ? {country: facility.address.country} : ""
        };
    })
};

/**
 *
 * @param {Object} item
 * @param {Object} item.eligibility
 * @param {String} item.eligibility.minimum_age
 * @param {String} item.eligibility.maximum_age
 * @param {String} item.eligibility.gender
 * @param {String} item.eligibility.sampling_method
 * @param {String} item.eligibility.healthy_volunteers
 * @returns {*}
 * @private
 */
let _get_eligibility = (item) =>
{
    if (!item.eligibility)
        return null;

    let _convert_to_ms = (age, type) =>
    {
        if (!age || !type)
            return 0;

        switch(type)
        {
            case "Minute":
            case "Minutes":
                return age * 1000 * 60;
            case "Hour":
            case "Hours":
                return age * 1000 * 60 * 60;
            case "Day":
            case "Days":
                return age * 1000 * 60 * 60 * 24;
            case "Week":
            case "Weeks":
                return age * 1000 * 60 * 60 * 24 * 7;
            case "Month":
            case "Months":
                return age * 1000 * 60 * 60 * 24 * 30;
            case "Year":
            case "Years":
                return age * 1000 * 60 * 60 * 24 * 365
        }
    };

    let min_age = parseInt(item.eligibility.minimum_age, 10);
    let max_age = parseInt(item.eligibility.maximum_age, 10);

    let min_period_type = min_age? /(Years?|Months?|Weeks?|Days?|Hours?|Minutes?)/.exec(item.eligibility.minimum_age)[0] : null;
    let max_period_type = max_age? /(Years?|Months?|Weeks?|Days?|Hours?|Minutes?)/.exec(item.eligibility.maximum_age)[0] : null;

    min_age = _convert_to_ms(min_age, min_period_type);
    max_age = _convert_to_ms(max_age, max_period_type);

    return {
        gender: item.eligibility.gender.toLowerCase(), //female, male, all
        ...min_age ? {minimum_age: item.eligibility.minimum_age} : "",
        ...max_age ? {maximum_age: item.eligibility.maximum_age} : "",
        ...min_age ? {min_age: min_age} : "",  //to compare
        ...max_age ? {max_age: max_age} : "" , //to compare
        sampling_method: item.eligibility.sampling_method === "Probability Sample",
        healthy_volunteers: item.healthy_volunteers === "Yes"
    }
};

/**
 *
 * @param {Object} item
 * @param {Object|Array} item.overall_official
 * @param {Object|Array} [item.overall_contact]
 * @param {Object|Array} [item.overall_contact_backup]
 * @returns {*}
 * @private
 */
let _get_authors = (item) =>
{
    let authors = obj_to_array(item.overall_official);
    let contacts = obj_to_array(item.overall_contact) || [];
    item.overall_contact_backup ? contacts.concat(obj_to_array(item.overall_contact_backup)) : null;

    authors = [].concat(authors || [], contacts || []);

    if (!authors || !authors.length)
        return null;

    authors = authors.reduce((res, author) =>
    {
        let found = false;
        res.forEach((author1, index) => {
            if (author.last_name === author1.last_name) {
                found = true;
                res[index] = Object.assign(author1, author);
            }
        });

        if (!found)
            res.push(author);
        return res
    }, []);

    return authors.map(author =>
    {
        let name = author.last_name.split(",");
        let parse_name = human_name_parser.parseName(name[0]);

        return {
            first_name: (author.first_name || parse_name.firstName || "").trim(),
            ...parse_name.middleName || author.middle_name?  {middle_name: (author.middle_name || parse_name.middleName || "").trim()} : "",
            last_name: parse_name.lastName.trim(),
            ...name[1] || author.degrees ? {degree: (author.degrees || name[1] || "").trim()} : "",
            ...author.role ? {role: author.role} : "", // "Principal Investigator","Sub-Investigator","Study Chair","Study Director"
            ...author.affiliation ? {affiliate : author.affiliation} : "",
            ...author.email ? {email: author.email} : "",
            ...author.phone ? {phone: author.phone} : ""
        }
    });
};

let _get_all_dates = (item) =>
{
    if (!item)
        return null;

    let _month_to_number = (month_name) =>
    {
        switch(month_name)
        {
            case "January" :
                return 0;
            case "February" :
                return 1;
            case "March" :
                return 2;
            case "April" :
                return 3;
            case "May" :
                return 4;
            case "June" :
                return 5;
            case "July" :
                return 6;
            case "August" :
                return 7;
            case "September" :
                return 8;
            case "October" :
                return 9;
            case "November" :
                return 10;
            case "December" :
                return 11;
        }
    };
    let _convert_to_date = (date_str) =>
    {
        if (!date_str)
            return null;
        if (date_str._)
            date_str = date_str._;

        let split_date = date_str.replace(",", "").split(" ");
        if (split_date.length === 3)
        {
            let year = split_date[2];
            let date = split_date[1];
            let month = _month_to_number(split_date[0]);
            return new Date(year, month, date).toISOString()
        }
        else if (split_date.length === 2)
        {
            let year = split_date[1];
            let month = _month_to_number(split_date[0]);
            let date = 1;
            return new Date(year, month, date).toISOString()
        }
        return null
    };

    let start_date            = _convert_to_date(item.start_date);
    let study_first_submitted = _convert_to_date(item.study_first_submitted);
    let verification_date     = _convert_to_date(item.verification_date);
    let last_update_submitted = _convert_to_date(item.last_update_submitted);
    let last_update_posted    = _convert_to_date(item.last_update_posted._);


    return {
        ...start_date ? {date_created: start_date} : "",
        ...study_first_submitted ? {date_first_submitted: study_first_submitted} : "",
        ...verification_date ? {date_verified: verification_date} : "",
        ...last_update_submitted ? {date_last_update: last_update_submitted} : "",
        ...last_update_posted ? {date_last_update_posted: last_update_posted} : ""
    }
};

let _get_keywords = (item) =>
{
    let result = [];

    if (item.condition_browse) {
        result = result.concat(obj_to_array(item.condition_browse.mesh_term))
    }
    if (item.intervention_browse) {
        result = result.concat(obj_to_array(item.intervention_browse.mesh_term))
    }
    if (item.keyword) {
        result = result.concat(obj_to_array(item.keyword))
    }

    result = _.uniq(result);

    return result.length ? result : null;
};

let _get_pubmed_relations = (item) => {
    let result = [];

    if (item.reference)
    {
        let ref = obj_to_array(item.reference)
        .map(({PMID}) => PMID)
        .filter(PMID => PMID);
        result = result.concat(ref)
    }

    if (item.results_reference)
    {
        let ref = obj_to_array(item.results_reference).map(({PMID}) => PMID);
        result = result.concat(ref)
    }

    result = _.uniq(result);

    return result.length ? result : null;
};

let _get_links = (item) => {

    if (item.links)
        return null;

    return obj_to_array(item.links)
};

let _get_phase = (item) => {
    if (!item.phase)
        return null;

    let phases = item.phase.split("/").map(phase => {
        switch(phase){
            case "N/A":
                return 0;
            case "Early Phase 1":
                return -1;
            default:
                return parseInt(phase.replace("Phase ", ""), 10);
        }
    }).filter(item => item);

    return phases.length ? phases : null;
};

let _get_status = (item) =>
{
    if (!item.overall_status || !item.last_known_status)
    {
        return null
    }
    return (item.overall_status || item.last_known_status)
};

let _get_sponsor = (item) =>
{
    if (!item.sponsors)
    {
        return null
    }
    let sponsors = item.sponsors.lead_sponsor ? obj_to_array(item.sponsors.lead_sponsor) : [];
    sponsors = obj_to_array(item.sponsors.collaborator) ? sponsors.concat(obj_to_array(item.sponsors.collaborator)) : sponsors;

    return sponsors.map(item =>
    {
        return {
            name: item.agency,
            type: item.agency_class
        }
    })
};
let _get_external_links = (item) =>
{
    if (!item.id_info)
    {
        return null
    }

    let external_links = [];
    for(let key in item.id_info)
    {
        if(typeof item.id_info[key] === "string")
            external_links.push({key: key, id: item.id_info[key]})
        else
        {
            item.id_info[key].forEach(value =>
                external_links.push({key: key, id: value})
            )
        }
    }

    return external_links;
};

let start = async() => {
    await init_dbs();
    let page = 0;
    let result = [];

    let count = await mongo_db.read("original", {body: {version: {$ne: version}}, count_only: true});

    do {
        result = await mongo_db.read("original", {body: {version: {$ne: version}}, size: limit});
        let mongo_bulk = [];

        result.forEach(item => {
            let keywords       = _get_keywords(item);
            let phase          = _get_phase(item);
            let facility       = _get_facilities(item);
            let eligibility    = _get_eligibility(item);
            let authors        = _get_authors(item);
            let dates          = _get_all_dates(item);
            let pubmed         = _get_pubmed_relations(item);
            let links          = _get_links(item);
            let status         = _get_status(item);
            let sponsor        = _get_sponsor(item);
            let external_links = _get_external_links(item);

            let document = {
                name          : item.brief_title,
                ...external_links ? {external_links: external_links} : "",
                ...item.brief_summary ? {description   : (item.brief_summary.textblock || "").replace(/\s+/g, " ").trim()} : "",
                ...phase ? {phase: phase} : "",
                ...authors && authors.length ? {authors: authors} : "",
                ...eligibility ? {eligibility : eligibility} : "",
                ...facility ? {facility : facility} : "",
                ...item.why_stopped ? {stopped_reason : item.why_stopped} : "",
                ...item.condition ? {condition: obj_to_array(item.condition)} : "",  // array of strings
                ...status ? {status: status} : "",
                ...item.study_type ? {study_type: item.study_type} : "",
                ...keywords ? {keywords: keywords} : "",
                ...pubmed ? {pubmed: pubmed} : "",
                ...links? {links: links} : "",
                ...sponsor ? {sponsor: sponsor} : "",
            };

            document = Object.assign(document, dates);
            mongo_bulk.push({command_name: "update", _id: item._id, document: document})
        });

        await mongo_db.bulk("converted", mongo_bulk);

        await mongo_db.update_many("original", {
            query: {_id: {$in :result.map(({_id}) => _id) }},
            data: {version: version}}
        );

        page++;
        console.log(count + "/" + page * limit);

    }while(result.length === limit)
};

start()
.then(() => process.exit())
.catch(e => console.error(e));