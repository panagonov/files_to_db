let utils        = require("../../../../../_utils/utils.js");
let import_utils = require("../../../../_utils/save_utils.js");


let category_fixer = (result, record) => {

    if (utils.isEmptyObj(record.crawler_item))
    {
        if (result.name.indexOf("Capp pipette,") === 0 || result.name.indexOf("Capp multi pipettes,") === 0){
            result.category = import_utils.get_canonical("Pipette", ":product_category");
            result.sub_category = import_utils.get_canonical("mechanical pipettes", ":product_sub_category");
        }
        else if (result.name.indexOf("Capp electronic pipette,") === 0){
            result.category = import_utils.get_canonical("Pipette", ":product_category");
            result.sub_category = import_utils.get_canonical("electronic pipettes", ":product_sub_category");
        }
        else if (/(volume controller knob|Stand for|service kit|decontamination|software|Pipette service)/.test(result.name)){
            result.category = import_utils.get_canonical("Pipette", ":product_category");
            result.sub_category = import_utils.get_canonical("pipette accessories", ":product_sub_category");
        }
        else if (/(, bag)/.test(result.name)){
            result.category = import_utils.get_canonical("pipette tips", ":product_category");
        }
        else if (/(peristaltic pump)/.test(result.name)){
            result.category = import_utils.get_canonical("accessories", ":product_category");
            result.sub_category = import_utils.get_canonical("Peristaltic Pump", ":product_sub_category")
        }
        // else if(["SK-03-BB", "SK-03-XX", "Cxxx-1-yyy"].indexOf(record.oid) !== -1) {
        //     result.category = import_utils.get_canonical("pipette equipment", ":product_category")
        // }
        // else if(["T100-FT", "T100-FT45", "PA-100FT-50", "PA-100FT"].indexOf(record.oid) !== -1) {
        //     result.category = import_utils.get_canonical("filter", ":product_category");
        //     result.sub_category = import_utils.get_canonical("pipette", ":product_category");
        // }
        // else if(["xxx-FE-yyy"].indexOf(record.oid) !== -1) {
        //     result.category = import_utils.get_canonical("pipette", ":product_category");
        //     result.sub_category = import_utils.get_canonical("pipette accessories", ":product_sub_category");
        // }
        // else if(["XA 82/220.3Y"].indexOf(record.oid) !== -1) {
        //     result.category = import_utils.get_canonical("balance", ":product_category");
        //     result.sub_category = import_utils.get_canonical("Analytical Balances", ":product_sub_category");
        // }
        // else if(["SVC-RW", "SVC-PC"].indexOf(record.oid) !== -1) {
        //     result.sub_category = import_utils.get_canonical("pipette", ":product_category");
        // }
        // else if(["RS-00-C"].indexOf(record.oid) !== -1) {
        //     result.sub_category = import_utils.get_canonical("retips", ":product_sub_category");
        // }
        // else if(["CRC-656"].indexOf(record.oid) !== -1) {
        //     result.category = import_utils.get_canonical("Clinical Centrifuge", ":product_sub_category");
        // }
    }

    if(["CR-68", "CR-68X"].indexOf(record.oid) !== -1) {
        result.category = import_utils.get_canonical("micro centrifuge", ":product_category");
        if (record.oid === "CR-68X")
        {
            record.name = "Capp Rondo Microcentrifuge w/ adjustable speed and timer function, max. 6000 rpm/2000g"
        }
        delete result.sub_category
    }
    else if(["W-8", "W-12", "W-16", "W-8KIT-115V", "W-8KIT-230V", "W-12KIT-115V", "W-12KIT-230V", "W-16KIT-115V", "W-16KIT-230V"].indexOf(record.oid) !== -1) {
        result.category = import_utils.get_canonical("plate washer", ":product_category");
    }
    else if(["WP-115V", "WP-230V"].indexOf(record.oid) !== -1) {
        result.category = import_utils.get_canonical("accessories", ":product_category");
        result.sub_category = import_utils.get_canonical("Vacuum pump", ":product_sub_category");
    }
    else if(["WB-1", "WB-3", "WB-4", "W-1000"].indexOf(record.oid) !== -1) {
        result.category = import_utils.get_canonical("accessories", ":product_category");
    }
    else if(["LM-421", "LM-431"].indexOf(record.oid) !== -1) {
        result.category = import_utils.get_canonical("accessories", ":product_category");
        result.sub_category = import_utils.get_canonical("Peristaltic Pump", ":product_sub_category")
    }
    // else if(["TH-0800", "PH-0001"].indexOf(record.oid) !== -1) {
    //     result.sub_category = import_utils.get_canonical("Pipette", ":product_category")
    // }

    if (result.sub_category && result.sub_category.length && ["polystyrene_pipettes"].indexOf(result.sub_category[0][1]) !== -1)
    {
        result.category =  result.category = import_utils.get_canonical("Pipette", ":product_category");
    }

    if (!result.category[0])
    {
        result.category = import_utils.get_canonical(result.name, ":product_category");
    }

    if (!result.category[0])
        debugger

    // if (["benchtop_instruments", "consumable"].indexOf(result.category[0][1]) !== -1)
    // {
    //     result.category = result.sub_category;
    //     result.sub_sub_category ? result.sub_category = result.sub_sub_category : delete result.sub_category
    // }
    return result
};

let run = (result, record) => {
    result = category_fixer(result, record);
    return result;
};

module.exports = run;

