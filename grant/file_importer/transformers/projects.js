let utils = require("./utils/utils.js");

let mapping = {
    "_id"                   : (record) => `${record["APPLICATION_ID"]}_${record["CORE_PROJECT_NUM"]}`,
    "app_id"                : "APPLICATION_ID",
    "activity"              : "ACTIVITY",
    "adm_ic"                : "ADMINISTERING_IC",
    "app_type"              : "APPLICATION_TYPE",
    "arra_funded"           : "ARRA_FUNDED",
    "award_notice_date"     : (record) => record["AWARD_NOTICE_DATE"] ? new Date(record["AWARD_NOTICE_DATE"]) : "",
    "budget_start"          : (record) => record["BUDGET_START"] ? new Date(record["BUDGET_START"]) : "",
    "budget_end"            : (record) => record["BUDGET_END"] ? new Date(record["BUDGET_END"]) : "",
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
    "org_city"              : "ORG_CITY",
    "org_country"           : "ORG_COUNTRY",
    "org_dept"              : "ORG_DEPT",
    "org_destrict"          : "ORG_DISTRICT",
    "org_duns"              : "ORG_DUNS",
    "org_fips"              : "ORG_FIPS",
    "org_ipf_code"          : "ORG_IPF_CODE",
    "org_name"              : "ORG_NAME",
    "org_state"             : "ORG_STATE",
    "org_zipcode"           : "ORG_ZIPCODE",
    "phr"                   : "PHR",
    "pi_ids"                : "PI_IDS",
    "pi_names"              : (record) => record["PI_NAMEs"]
                                .split(";")
                                .map(name => {
                                    let [last_name  = "", other_name = ""] = name.trim().split(",");
                                    other_name      = other_name.trim().split(" ");
                                    let first_name  = (other_name.shift() || "").trim().replace(".", "");
                                    let middle_name = other_name.join(" ").trim().replace(/\./g, "");
                                    return {
                                        last_name: last_name.replace(".", ""),
                                        ...first_name ? {first_name: first_name} : "",
                                        ...middle_name ? {middle_name: middle_name} : ""
                                    };
                                }),
    "officer_name"          : "PROGRAM_OFFICER_NAME",
    "date_start"            : (record) => record["PROJECT_START"] ? new Date(record["PROJECT_START"]) : "",
    "date_end"              : (record) => record["PROJECT_END"] ? new Date(record["PROJECT_END"]) : "",
    "terms"                 : (record) => record["PROJECT_TERMS"] ? record["PROJECT_TERMS"].split(";").map(term => term.trim()) : "",
    "name"                  : "PROJECT_TITLE",
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
    disable: false
};