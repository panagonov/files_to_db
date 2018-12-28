let utils = require("../../../_utils/utils.js");

let mapping = {
    "_id"                   : (record) => `${record["APPLICATION_ID"]}_${record["CORE_PROJECT_NUM"]}`,
    "app_id"                : "APPLICATION_ID",
    "activity"              : "ACTIVITY",
    "adm_ic"                : "ADMINISTERING_IC",
    "app_type"              : "APPLICATION_TYPE",
    "arra_funded"           : "ARRA_FUNDED",
    "cfda_code"             : "CFDA_CODE",
    "core_project_num"      : "CORE_PROJECT_NUM",
    "inst_type"             : "ED_INST_TYPE",
    "foa_number"            : "FOA_NUMBER",
    "full_number"           : "FULL_PROJECT_NUM",
    "funding_ics"           : "FUNDING_ICs",
    "funding_mechanism"     : "FUNDING_MECHANISM",
    "year"                  : (record) => record["FY"] ? parseInt(record["FY"], 10) : "",
    "ic_name"               : "IC_NAME",
    "nih_cats"              : "NIH_SPENDING_CATS",
    "phr"                   : "PHR",
    "affiliate"             : (record) => ({
        ...record["ORG_NAME"]    ? {name: record["ORG_NAME"]} : "",
        ...record["ORG_CITY"]    ? {city: record["ORG_CITY"]} : "",
        ...record["ORG_COUNTRY"] ? {country: record["ORG_COUNTRY"]} : "",
        ...record["ORG_FIPS"]    ? {alpha_two_code: record["ORG_FIPS"]} : "",
        ...record["ORG_STATE"]   ? {state: record["ORG_STATE"]} : "",
        ...record["ORG_ZIPCODE"] ? {post_code: record["ORG_ZIPCODE"]} : "",
        ...record["ORG_DISTRICT"]? {district: record["ORG_DISTRICT"]} : "",
        ...record["ORG_DUNS"]    ? {duns_id: record["ORG_DUNS"]} : "",
        ...record["ORG_IPF_CODE"]? {ipf_id: record["ORG_IPF_CODE"]} : "",
        ...record["ORG_DEPT"] &&  record["ORG_DEPT"] !== "NONE" ? {department: record["ORG_DEPT"]} : ""
    }),
    "external_links"        : (record) => {
        let result = [];
        result.push({key: "ProjectReporter", id: record["APPLICATION_ID"]});
        record["CORE_PROJECT_NUM"] ? result.push({key: "GrantCoreNr", id: record["CORE_PROJECT_NUM"]}) : null;
        record["FULL_PROJECT_NUM"] ? result.push({key: "GrantFullNr", id: record["FULL_PROJECT_NUM"]}) : null;
        record["FOA_NUMBER"] ? result.push({key: "GrantFoaNr", id: record["FOA_NUMBER"]}) : null;

        return result
    },
    "pi_names"              : (record) => record["PI_NAMEs"]
                                .split(";")
                                .map((name, index) => {
                                    let [last_name  = "", other_name = ""] = name.toLowerCase().trim().split(",");
                                    other_name      = other_name.trim().split(" ");
                                    let first_name  = (other_name.shift() || "").trim().replace(".", "");
                                    let middle_name = other_name.join(" ").trim().replace(/\./g, "");

                                    first_name ? first_name = first_name[0].toUpperCase() + first_name.slice(1, first_name.length) : null;
                                    middle_name ? middle_name = middle_name[0].toUpperCase() + middle_name.slice(1, middle_name.length) : null;
                                    last_name ? last_name = last_name[0].toUpperCase() + last_name.slice(1, last_name.length) : null;
                                    if (first_name || middle_name || last_name)
                                    {
                                        let ids = (record["PI_IDS"] || "").split(";");
                                        return {
                                            ...ids[index] ? {_id: ids[index]} : "",
                                            ...last_name ? {last_name: last_name.replace(".", "")} : "",
                                            ...first_name ? {first_name: first_name} : "",
                                            ...middle_name ? {middle_name: middle_name} : ""
                                        };
                                    }
                                    return null
                                })
                                .filter(name => name),
    "officer_name"          : (record) => {
                                if (!record["PROGRAM_OFFICER_NAME"])
                                {
                                    return null;
                                }
                                 let [last_name  = "", other_name = ""] = record["PROGRAM_OFFICER_NAME"].toLowerCase().trim().split(",");
                                other_name      = other_name.trim().split(" ");
                                let first_name  = (other_name.shift() || "").trim().replace(".", "");
                                let middle_name = other_name.join(" ").trim().replace(/\./g, "");

                                first_name ? first_name = first_name[0].toUpperCase() + first_name.slice(1, first_name.length) : null;
                                middle_name ? middle_name = middle_name[0].toUpperCase() + middle_name.slice(1, middle_name.length) : null;
                                last_name ? last_name = last_name[0].toUpperCase() + last_name.slice(1, last_name.length) : null;
                                if (first_name || middle_name || last_name)
                                {
                                    return {
                                        ...last_name ? {last_name: last_name.replace(".", "")} : "",
                                        ...first_name ? {first_name: first_name} : "",
                                        ...middle_name ? {middle_name: middle_name} : ""
                                    };
                                }
                                else
                                    return null
                            },
    "award_notice_date"     : (record) => record["AWARD_NOTICE_DATE"] ? new Date(record["AWARD_NOTICE_DATE"]) : "",
    "budget_start"          : (record) => record["BUDGET_START"] ? new Date(record["BUDGET_START"]) : "",
    "budget_end"            : (record) => record["BUDGET_END"] ? new Date(record["BUDGET_END"]) : "",
    "date_start"            : (record) => record["PROJECT_START"] ? new Date(record["PROJECT_START"]) : "",
    "date_end"              : (record) => record["PROJECT_END"] ? new Date(record["PROJECT_END"]) : "",
    "terms"                 : (record) => record["PROJECT_TERMS"] ? record["PROJECT_TERMS"].split(";").map(term => term.trim()).filter(term => term) : "",
    "name"                  : (record) => record["PROJECT_TITLE"] ? record["PROJECT_TITLE"][0] +  record["PROJECT_TITLE"].slice(1,record["PROJECT_TITLE"].length).toLowerCase() : null,
    "serial_number"         : "SERIAL_NUMBER",
    "study_section"         : "STUDY_SECTION",
    "study_name"            : "STUDY_SECTION_NAME",
    "sub_project_id"        : "SUBPROJECT_ID",
    "suffix"                : "SUFFIX",
    "support_year"          : "SUPPORT_YEAR",
    "direct_cost_amt"       : (record) => {record["DIRECT_COST_AMT"] ? parseInt(record["DIRECT_COST_AMT"], 10) : ""},
    "indirect_cost_amt"     : (record) => record["INDIRECT_COST_AMT"] ? parseInt(record["INDIRECT_COST_AMT"], 10) : "",
    "total_cost"            : (record) => record["TOTAL_COST"] ? parseInt(record["TOTAL_COST"], 10) : "",
    "total_cost_sub_project": (record) => record["TOTAL_COST_SUB_PROJECT"] ? parseInt(record["TOTAL_COST_SUB_PROJECT"], 10) : ""
};

let transform = (record) =>
{
    return utils.mapping_transform(mapping, record);
};

module.exports = {
    transform: transform,
    disable: false,
    allow_duplicated: true
};