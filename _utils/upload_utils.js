let fs              = require("fs");
let request         = require("request");
let s3              = require("../../bioseek/discovery/core/s3.js");
let image_minimizer = require('../../bioseek/discovery/core/utilities/image_minimizer.js');

let temp_dir = `${__dirname}/_download/`;
let bucket_name = "bioseek-shop/";

let cookies = request.jar();
let browser = request.defaults({proxy: "http://69.46.80.226:12360"});

let check_is = {
    "image" : async(url) =>
        new Promise((resolve, reject) =>{
            url = url.replace(".co.uk", ".com");
            browser.get({
                method: "HEAD",
                url: url,
                headers : {'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36"},
                followAllRedirects: true,
                maxRedirects: 100,
                jar: cookies,
                strictSSL: false
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
        url = url.replace(".co.uk", ".com");
        browser(url).pipe(fs.createWriteStream(path)).on("close", function(err, res)
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
    let is_exists = await s3.is_file_exists(bucket_name + path, id);

    if (is_exists)
        return id;

    let file_data = await check_is[file_type](url);
    if (file_data.confirm)
    {
        let file = await download_file(url, id);
        let compressed_image = file // await image_minimizer(file);

        await s3.upload({
            Bucket: bucket_name + path,
            ContentType: file_data.content_type,
            Body: compressed_image,
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

    console.time("IMAGE");

    if (file_data.link && file_data.link.indexOf("http") === 0)
    {
        link_id = await upload_to_s3(file_data.link, path, image_name, meta, "image");
        try {
            fs.unlinkSync(temp_dir + link_id)
        }
        catch(e){}
    }
    if (file_data.thumb_link && file_data.link.indexOf("http") === 0)
    {
        thumb_link_id = await upload_to_s3(file_data.link, path, image_name + "_thumb", meta, "image");
        try {
            fs.unlinkSync(temp_dir + thumb_link_id);
        }
        catch(e){}
    }
    console.timeEnd("IMAGE");
    return {link_id, thumb_link_id}
};

module.exports = {
    upload_product_image
};