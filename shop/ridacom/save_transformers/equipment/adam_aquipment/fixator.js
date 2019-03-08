let utils        = require("../../../../../_utils/utils.js");
let import_utils = require("../../../../_utils/save_utils.js");


let category_fixer = (result, record) => {

    if (utils.isEmptyObj(record.crawler_item))
    {
        if (/(Anti-Vibration Table|Density Kit|cable|wet cover|printer|Certificate|Weight|cover| kit | pads |USB|program)/i.test(result.name)){
            result.category = import_utils.get_canonical("Balance", ":product_category");
            result.sub_category = import_utils.get_canonical("Accessories", ":product_category");
        }

    }
    else
    {
        if (["AE 402", "GK", "GK-M", "GC"].indexOf(result.oid) !== -1)
        {
            result.sub_category = import_utils.get_canonical("Accessories", ":product_category");
        }
    }

    return result
};

let run = (result, record) => {
    result = category_fixer(result, record);
    return result;
};

module.exports = run;

