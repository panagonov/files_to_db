/**
 * https://clinicaltrials.gov/ct2/resources/download
 * https://clinicaltrials.gov/AllPublicXML.zip
 */

let fs       = require('fs');
let parser   = require("xml2js").parseString;
let Mongo_db = require("../_utils/db");

let mongo_db;

let init_dbs = async() =>
{
    mongo_db = new Mongo_db();
    await mongo_db.init("clinical_trails");
};

let parse_xml_to_json = async (xml) =>
    new Promise((resolve, reject) =>
    {
        parser(xml, (err, result) => {
            if(err)
            {
                console.error(e);
                return reject();
            }

            resolve(result)
        })
    });

let convert_obj = (obj) =>
{
    if (!(obj instanceof Object))
    {
        return obj
    }
    if (obj instanceof Array && obj.length === 1)
    {
        return convert_obj(obj[0])
    }
    if (obj instanceof Array && obj.length > 1)
    {
        return obj.map(item => convert_obj(item))
    }

    let result = {};

    for(let key in obj)
    {
        let result_key = key === "$" ? "_$" : key;

        result[result_key] = convert_obj(obj[key]);
    }

    return result
};

let start = async() =>
{
    await init_dbs();

    let directoriesList = fs.readdirSync("./_sources");

    for (let i = 0 ; i < directoriesList.length; i++)
    {
        let results = [];
        let dir_name = directoriesList[i];
        if (fs.lstatSync(`./_sources/${dir_name}`).isDirectory()) {
            let files = fs.readdirSync(`./_sources/${dir_name}`);

            console.log("Converting ", dir_name, " - ", files.length + " files");

            for(let j = 0; j < files.length; j++)
            {
                let file_name = files[j];

                let file_content = fs.readFileSync(`./_sources/${dir_name}/${file_name}`, "utf8");
                let obj = await parse_xml_to_json(file_content.replace(/(\n|\r)/gm, ""));

                let result = convert_obj(obj.clinical_study);

                result._id = result.id_info.nct_id;
                // console.log(file_name)
                results.push(result)
            }
            await mongo_db.create_many("original", {data: results});
            console.log(dir_name, `${i}/${directoriesList.length}`)
        }
    }
};

start()
.catch(e => console.error(e));