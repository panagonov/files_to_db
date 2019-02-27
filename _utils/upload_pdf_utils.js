let fs = require("fs");
let request = require("request");
let uuid    = require("uuid/v4");
let s3      = require("../../bioseek/discovery/core/s3.js");
let exec     = require("child_process").exec;

let temp_dir = `${__dirname}/_download/`;
let bucket_name = "bioseek-shop/";
let check_timeout = 20000;

let check_is = {
    "pdf" : async(url) =>
        new Promise((resolve, reject) => {

            let timeout = setTimeout(() => {
                timeout = null;
                resolve({confirm: false})
            }, check_timeout);

            request.get({
                method: "HEAD",
                url: url
            }, (err, response, body) =>
            {
                if (!timeout)
                    return;

                clearTimeout(timeout);

                if ( err || response.statusCode === 404 || ["application/pdf"].indexOf(response.headers["content-type"]) === -1 )
                    return resolve({confirm: false});
                resolve({confirm: true, content_type: response.headers["content-type"]})
            })
        }),
};

let convert_pdf_to_image = async(source) =>
    new Promise((resolve, reject) =>
    {
        let dest = source.split(".").shift();
        exec(`pdftopng -r 72 -f 1 -l 1 ${source} ${dest}`, (err, result) =>
        {
            if (err)
                return reject(err);

            resolve(dest);
        })
    });


let download_file = async(url, target) =>
    new Promise((resolve, reject) => {
        let path = temp_dir + target;
        request(url).pipe(fs.createWriteStream(path)).on("close", function(err, res)
        {
            if (err) return reject(err);
            resolve (fs.readFileSync(path));
        });
    });

let is_file_exists = async (path, id) =>
    await s3.is_file_exists(bucket_name + path, id);

let upload_to_s3 = async(url, path, id, meta = {}, content_type) =>
{
    let file = await download_file(url, id);
    await s3.upload({
        Bucket: bucket_name + path,
        ContentType: content_type,
        Body: file,
        Key: id,
        Metadata: meta
    });
    return id
};

let upload_product_pdf = async({file_data, path, file_name, image_index, meta = {}}) => {

    let thumb_name = "";
    let link_name = "";

    console.time("Start PDF");
    let file_exists = await is_file_exists(path, file_name);

    if (file_data.link && !file_exists)
    {
        let link_data = await check_is.pdf(file_data.link);

        if (link_data.confirm)
        {
            link_name = file_name;
            thumb_name = file_name.split(".").shift() + "-000001.png";

            await download_file(file_data.link, file_name);

            await convert_pdf_to_image(temp_dir + file_name);

            await upload_to_s3(file_data.link, path, file_name, meta, link_data.content_type);
            await upload_to_s3(file_data.link, path, thumb_name, meta);

            fs.unlinkSync(temp_dir + file_name);
            fs.unlinkSync(temp_dir + thumb_name);
        }
    }
    console.timeEnd("Start PDF");

    return {link_name, thumb_name}
};


module.exports = {
    upload_product_pdf
};