let hash_builder                = require("./utils/hash_builder.js");
let replace_with_canonical_name = require("./utils/replace_with_canonical_name.js");
let analyzer_builder            = require("./utils/analyzer_builder.js");
let directory_reader            = require("../../_utils/directory_reader.js");
let build_affiliates_list       = require("./utils/build_affiliates_list.js");

let affiliate_match_in_projects        = require("./affiliate_match_in_projects.js");
let add_missing_affiliates_in_projects = require("./add_missing_affiliates_in_projects.js");
let affiliate_match_in_patents        = require("./affiliate_match_in_patents.js");
let add_missing_affiliates_in_patents = require("./add_missing_affiliates_in_patents.js");

let run = async(mongo_db) =>
{
    await build_affiliates_list.init();
    await build_affiliates_list.run();

    let resources = directory_reader(`${__dirname}/resources/`, "json");

    let analyzers    = [
        analyzer_builder.country(resources),
        analyzer_builder.city(resources)
    ];

    let hash = {
        country     : hash_builder.country(resources),
        country_code: hash_builder.country_code(resources),
        city        : hash_builder.city(resources),
        affiliate   : hash_builder.affiliate(resources)
    };

    // await affiliate_match_in_projects.run(mongo_db, hash);
    // await add_missing_affiliates_in_projects.run(mongo_db);
    await affiliate_match_in_patents.run(mongo_db, hash);
    await add_missing_affiliates_in_patents.run(mongo_db);
};

let clean = async() =>
{
    build_affiliates_list.clean();
};

module.exports = {
    run,
    clean
};