let utils        = require("../../../../../_utils/utils.js");
let import_utils = require("../../../../_utils/save_utils.js");


let category_fixer = (result, record) => {

   if (["BV1010-00", "BV1010-50HQ"].indexOf(result.oid) !== -1)
    {
        result.category = import_utils.get_canonical("Accessories", ":product_category");
        result.sub_category = import_utils.get_canonical("Vortexer", ":product_category");
    }
    else if (["R4040-1520", "R4040-150", "R4040-500", "R4040-HZ15", "R4040-HZ50"].indexOf(result.oid) !== -1)
    {
        result.sub_category = import_utils.get_canonical("Rotator", ":product_category");
    }
    else if (["B3D5000-STK", "B3D5000-DIMP", "B3D-STACK", "B3D-STACK-D", "BR1000-STACK-D"].indexOf(result.oid) !== -1)
    {
        result.sub_category = import_utils.get_canonical("Rocker", ":product_category");
    }
    else if (["BR2000-FLAT", "BR1000-FLAT"].indexOf(result.oid) !== -1)
    {
        result.sub_category = import_utils.get_canonical("Shaker", ":product_category");
    }
    else if (["H1000-MR-T14"].indexOf(result.oid) !== -1)
    {
        result.sub_category = import_utils.get_canonical("Shaker Incubator", ":product_category");
    }
    else if (["H5000-12","H5000-20","H5000-150","H5000-500","H5000-MP", "H5000-DWMP", "H5000-WB","H5000-5MT"].indexOf(result.oid) !== -1)
    {
        result.sub_category = import_utils.get_canonical("Vortexer Incubator", ":product_category");
    }
    else if (result.oid === "BV1003-E")
    {
        result.category = import_utils.get_canonical("Vortexer", ":product_category");

    }
    else if  (["D2400-R5","D1036-A5", "D1031-T20", "D1031-T21", "D1031-RF", "D1033-30G"].indexOf(result.oid) !== -1){
        result.sub_category = import_utils.get_canonical("Homogenizer", ":product_category");
    }
    else if  (["D1131-01", "D1131-05", "D1131-10", "D1132-01TP", "D1132-05TP", "D1132-10TP", "D1132-15TP", "D1132-30TP", "D1133-28", "D1132-60", "D1133-G"].indexOf(result.oid) !== -1){
        result.category = import_utils.get_canonical("Accessories", ":product_category");
        result.sub_category = import_utils.get_canonical("Homogenizer", ":product_category");
    }
    else if  (["SB0012-T1520"].indexOf(result.oid) !== -1){
        result.category = import_utils.get_canonical("Accessories", ":product_category");
        result.sub_category = import_utils.get_canonical("Water Bath", ":product_sub_category");
    }
    else if  (["BSH100-CU", "BSH100-01", "BSW15"].indexOf(result.oid) !== -1){
        result.category = import_utils.get_canonical("Accessories", ":product_category");
        result.sub_category = import_utils.get_canonical("Dry Bath", ":product_sub_category");
    }
    else if  (["H2300-SH"].indexOf(result.oid) !== -1){
        result.category = import_utils.get_canonical("Accessories", ":product_category");
        result.sub_category = import_utils.get_canonical("Incubator", ":product_category");
    }
    else if  (["H3760-CS", "H4000-ROD"].indexOf(result.oid) !== -1){
        result.sub_category = import_utils.get_canonical("Digital hotplate", ":product_sub_category");
        result.product_relations = ["PRODUCT_SOURCE:[BENCHMARK]_SUPPLIER:[RIDACOM]_ID:[H3760-HS-E]","PRODUCT_SOURCE:[BENCHMARK]_SUPPLIER:[RIDACOM]_ID:[H3760-SE]","PRODUCT_SOURCE:[BENCHMARK]_SUPPLIER:[RIDACOM]_ID:[H3760-H-E]"];
    }
    else if  (["D1031-ST25", "C1005-AC2", "C1005-T5-RK2", "C1005-T5* Clear", "C1005-T5-LOCK"].indexOf(result.oid) !== -1){
       result.category = import_utils.get_canonical("Accessories", ":product_category");
       result.sub_category = import_utils.get_canonical("micro centrifuge", ":product_category");
    }
    else if  (["C1008-ROT2", "C1008-A2-9"].indexOf(result.oid) !== -1){
       result.category = import_utils.get_canonical("Accessories", ":product_category");
       result.sub_category = import_utils.get_canonical("mini centrifuge", ":product_category");
    }
    else if  (["A2505", "A2501"].indexOf(result.oid) !== -1){
       result.category = import_utils.get_canonical("Agarose", ":product_category");
       result.sub_category = import_utils.get_canonical("Agarose tablets", ":product_sub_category");
    }
    else if  (["A1801-LM", "A1801-HR", "A1801-31"].indexOf(result.oid) !== -1){
       result.category = import_utils.get_canonical("Agarose", ":product_category");
       result.sub_category = import_utils.get_canonical("Specialty Agarose", ":product_sub_category");
    }
    else if  (["A1700", "A1701", "A1705"].indexOf(result.oid) !== -1){
       result.category = import_utils.get_canonical("Agarose", ":product_category");
    }
    else if  (["B3000-CAP*", "B3000-RIN", "B3000-CAP2", "B3000-RIN2", "B3000-CAP-HTC"].indexOf(result.oid) !== -1){
       result.sub_category = import_utils.get_canonical("Bottle", ":product_category");
    }

    return result
};

let run = (result, record) => {
    result = category_fixer(result, record);
    return result;
};

module.exports = run;

