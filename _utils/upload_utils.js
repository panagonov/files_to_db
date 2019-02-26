let fs = require("fs");
let request = require("request");
let uuid    = require("uuid/v4");
let s3      = require("../../bioseek/discovery/core/s3.js");
let exec     = require("child_process").exec;

let temp_dir = `${__dirname}/_download/`;
let bucket_name = "bioseek-shop/";

let check_is = {
    "image" : async(url) =>
        new Promise((resolve, reject) =>{
            request.get({
                method: "HEAD",
                url: url
            }, (err, response, body) =>
            {
                if ( err || response.statusCode === 404 || ["image/png", "image/jpg", "image/jpeg"].indexOf(response.headers["content-type"]) === -1 )
                    return resolve({confirm: false});
                resolve({confirm: true, content_type: response.headers["content-type"]})
            })
        })
};

let download_file = async(url, target) =>
    new Promise((resolve, reject) => {
        let path = temp_dir + target;
        request(url).pipe(fs.createWriteStream(path)).on("close", function(err, res)
        {
            if (err) return reject(err);
            resolve (fs.readFileSync(path));
            try {
                fs.unlinkSync(path)
            }
            catch(e)
            {
                console.error(e)
            }
        });
    });

let upload_to_s3 = async(url, path, id, meta = {}, file_type) =>
{
    id = id || uuid();
    let is_exists = await s3.is_file_exists(bucket_name + path, id);

    if (is_exists)
        return id;

    let file_data = await check_is[file_type](url);
    if (file_data.confirm)
    {
        let file = await download_file(url, id);
        await s3.upload({
            Bucket: bucket_name + path,
            ContentType: file_data.content_type,
            Body: file,
            Key: id,
            Metadata: meta
        });
        return id
    }

    return null
};

let upload_product_image = async({file_data, path, product_id, image_index, meta = {}}) => {

    let image_name = product_id.replace(/\W/g, "_") + "_" + image_index;
    let link_id = image_name, thumb_link_id;

    if (file_data.link)
    {
        link_id = await upload_to_s3(file_data.link, path, image_name, meta, "image");
        fs.unlinkSync(temp_dir + link_id)
    }
    if (file_data.thumb_link)
    {
        thumb_link_id = await upload_to_s3(file_data.link, path, image_name + "_thumb", meta, "image");
        fs.unlinkSync(temp_dir + thumb_link_id);
    }

    return {link_id, thumb_link_id}
};

module.exports = {
    upload_product_image
};