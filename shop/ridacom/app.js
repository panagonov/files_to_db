/********************************************************************
 *
 * http://www.cloud-clone.com/
 * https://www.abbkine.com/
 * https://www.capp.dk/
 * http://www.genomeme.ca
 * https://www.adamequipment.co.uk
 * http://www.himedialabs.com
 * http://www.benchmarkscientific.com ; http://http://www.accuris-usa.com
 * http://www.affbiotech.com/
 *
 ********************************************************************/

let fs             = require("fs");
// let file_importer  = require("./file_importer.js");
// let aggregate_data = require("./aggregate.js");
let save_to_es_db  = require("./save_to_es_db.js");
// let image_uploader = require("./image_uploader.js");
// let pdf_uploader   = require("./pdf_uploader.js");
// let suggest_image_fixer   = require("./suggest_images_fixer");

let update_fields_list = /*{human_readable_id: 1}*/ null;

let distributor = "ridacom";
let suppliers   = fs.readdirSync(__dirname + "/import_transformers");

let run = async(mongo_db, crawler_db) =>
{
    // for (let i = 0; i < suppliers.length; i++)
    // {
    //     await file_importer.run(mongo_db, distributor, suppliers[i]);
    //     await aggregate_data.run(mongo_db, crawler_db, suppliers[i]);
    // }

    await save_to_es_db.run(mongo_db, crawler_db, distributor, update_fields_list);
    // await image_uploader.run(crawler_db);
    // await pdf_uploader.run(crawler_db);
    // await suggest_image_fixer.run()
};

let clean = async(mongo_db, crawler_db) =>
{
    await file_importer.clean(mongo_db, crawler_db);
    await aggregate_data.clean(mongo_db, crawler_db);
    await save_to_es_db.clean(mongo_db, crawler_db);
};

module.exports = {
    run,
    clean
};