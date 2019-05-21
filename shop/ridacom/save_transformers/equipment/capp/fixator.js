let utils        = require("../../../../../_utils/utils.js");
let import_utils = require("../../../../_utils/save_utils.js");


let category_fixer = (result, record) =>
{
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

