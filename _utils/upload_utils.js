let fs = require("fs");
let request = require("request");
let uuid    = require("uuid/v4");
let s3      = require("../../bioseek/discovery/core/s3.js");

let temp_dir = `${__dirname}/_download/`;
let bucket_name = "bioseek-shop/";

let check_is_image = async(url) =>
    new Promise((resolve, reject) =>{
        request.get({
            method: "HEAD",
            url: url
        }, (err, response, body) =>
        {
            if ( err || response.statusCode === 404 || ["image/png", "image/jpg", "image/jpeg"].indexOf(response.headers["content-type"]) === -1 )
                return resolve({is_image: false});
            resolve({is_image: true, content_type: response.headers["content-type"]})
        })
    });

let download_image = async(url, target) =>
    new Promise((resolve, reject) => {
        let path = temp_dir + target;
        request(url).pipe(fs.createWriteStream(path)).on("close", function(err, res)
        {
            if (err) return reject(err);
            resolve (fs.readFileSync(path));
            fs.unlinkSync(path)
        });
    });

let upload_image = async(url, path, id, meta = {}) =>
{
    id = id || uuid();
    let is_exists = await s3.is_file_exists(bucket_name + path, id);

    if (is_exists)
        return id;

    let image_data = await check_is_image(url);
    if (image_data.is_image)
    {
        let img = await download_image(url, id);
        await s3.upload({
            Bucket: bucket_name + path,
            ContentType: image_data.content_type,
            Body: img,
            Key: id,
            Metadata: meta
        });
        return id
    }

    return null
};

let upload_product_image = async({image_data, path, product_id, image_index, meta = {}}) => {

    let image_name = product_id.replace(/\W/g, "_") + "_" + image_index;
    let link_id = image_name, thumb_link_id;

    if (image_data.link)
    {
        link_id = await upload_image(image_data.link, path, image_name, meta)
    }
    if (image_data.thumb_link)
    {
        thumb_link_id = await upload_image(image_data.link, path, image_name + "_thumb", meta)
    }

    return {link_id, thumb_link_id}
};


module.exports = {
    upload_product_image
};