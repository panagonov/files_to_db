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
            result.category = import_utils.get_canonical("consumable", ":product_category");
            result.sub_category = import_utils.get_canonical("pipette tips", ":product_sub_category");
        }
        else if (/(Clinical Centrifuge)/.test(result.name)){
            result.category = import_utils.get_canonical("centrifuge", ":product_category")
        }
        else if (/(peristaltic pump)/.test(result.name)){
            result.category = import_utils.get_canonical("other benchtop", ":product_sub_category")
        }
    }

    if (result.sub_category && result.sub_category.length && ["polystyrene_pipettes"].indexOf(result.sub_category[0][1]) !== -1)
    {
        result.category =  result.category = import_utils.get_canonical("Pipette", ":product_category");
    }

    if (!result.category[0])
        debugger

    if (["benchtop_instruments", "consumable"].indexOf(result.category[0][1]) !== -1)
    {
        result.category = result.sub_category;
        result.sub_sub_category ? result.sub_category = result.sub_sub_category : delete result.sub_category
    }
    return result
};

let run = (result, record) => {
    result = category_fixer(result, record);
    return result;
};

module.exports = run;

