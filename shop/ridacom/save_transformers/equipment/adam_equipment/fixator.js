let utils        = require("../../../../../_utils/utils.js");
let import_utils = require("../../../../_utils/save_utils.js");

let category_fixer = record => {

    let result = {};

    if (/(Anti-Vibration Table|Density Kit|cable|wet cover|printer|Certificate|Weight|cover| kit | pads |USB|program)/i.test(record.name)){
        result.category = import_utils.get_canonical("Other Lab Accessories", ":product_category");
    }
    else if (["AE 402","GK", "GK-M", "GC"].indexOf(record.oid) !== -1)
    {
        result.category = import_utils.get_canonical("Weight Indicators", ":product_category");
    }

    if (record.name.indexOf("Calibration Certificate") !== -1){
        result.category = import_utils.get_canonical("Other Lab Accessories", ":product_category");
        result.sub_category = import_utils.get_canonical("Calibration certificate", ":product_sub_category");
    }

    return result
};

let run = (result, record) => {
    result = category_fixer(result, record);
    return result;
};

module.exports = run;