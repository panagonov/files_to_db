let utils = require("./utils/utils.js");

module.exports = {
    transform : (file_contents) =>
    {
        let json = utils.str_to_json(file_contents);

        if (json)
        {
            // json = utils.clean_json(json);
            json = utils.transform_date(json);
        }

        return json;
    }
};