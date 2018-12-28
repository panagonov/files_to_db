let utils = require("../../../_utils/utils.js");

let mapping = {
    "_id"               : "PMID",
    "affiliate"         : "AFFILIATION",
    "authors"           : (record) => record["AUTHOR_LIST"]
                            .split(";")
                            .map(name => {
                                let [last_name, other_name] = name.split(",");
                                other_name                  = (other_name || "").trim().split(" ");
                                let first_name              = other_name.shift();
                                let middle_name             = other_name.join(" ").trim();
                                return {
                                    last_name: last_name,
                                    ...first_name ? {first_name: first_name} : "",
                                    ...middle_name ? {middle_name: middle_name} : ""
                                };
                            }),
    "name"              : "PUB_TITLE",
    "country"           : (record) => record["COUNTRY"].toLowerCase(),
    "issn"              : "ISSN",
    "journal_issue"     : "JOURNAL_ISSUE",
    "journal_title"     : "JOURNAL_TITLE",
    "journal_title_abbr": "JOURNAL_TITLE_ABBR",
    "journal_volume"    : "JOURNAL_VOLUME",
    "journal_page"      : "PAGE_NUMBER",
    "lang"              : (record) => record["LANG"].toLowerCase(),
    "pmc_id"            : "PMC_ID",
    "date_published"    : (record) => {
        let date = record["PUB_DATE"];
        date = date.trim().split(" ");
        let year = parseInt(date[0]);
        let month = date[1];
        if (month)
            month = month.split("-");
        let day = parseInt(date[2]);
        return {
            year: year,
            ...month ? {month : month} : "",
            ...day ? {day: day} : ""
        }
    }
};

let transform = (record) =>
{
    return utils.mapping_transform(mapping, record);
};

module.exports = {
    transform: transform,
    disable: false
};