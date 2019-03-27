let fs              = require("fs");
let request         = require("request");
let s3              = require("../../bioseek/discovery/core/s3.js");
let image_minimizer = require('../../bioseek/discovery/core/utilities/image_minimizer.js');

let temp_dir = `${__dirname}/_download/`;
let bucket_name = "bioseek-shop/";
let thumbnail_size = 100; //width in pixels

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

let download_from_s3 = async(path, id) =>
{
    let res = await s3.download(bucket_name + path, id);
    return {file: res.Body, content_type : res.ContentType}
};

let upload_to_s3 = async ({path, id, meta = {}, content_type, file_body}) =>
{
    await s3.upload({
        Bucket     : bucket_name + path,
        ContentType: content_type,
        Body       : file_body || fs.readFileSync(temp_dir + id),
        Key        : id,
        Metadata   : meta
    });
    return id;
};

let upload_product_image = async({file_data, path, product_id, image_index, meta = {}}) => {

    let link_id = product_id.replace(/\W/g, "_") + "_" + image_index;
    let thumb_link_id = link_id + "_thumb_" + thumbnail_size;

    console.time("IMAGE");

    if (file_data.link && file_data.link.indexOf("http") === 0)
    {
        let file_exists = await s3.is_file_exists(bucket_name + path, product_id);
        if (!file_exists)
        {
            let file_data = await check_is.image(link_id);

            if (file_data.confirm)
            {
                let file = await download_file(file_data.link, link_id);
                let compressed_image = file; // await image_minimizer(file);
                await upload_to_s3({path, id: link_id, meta, content_type: file_data.content_type, file_body: compressed_image});

                let thumbnail = await image_minimizer(file, {width: thumbnail_size});
                await upload_to_s3({path, id: thumb_link_id, meta, content_type: file_data.content_type, file_body: thumbnail});

                try {
                    fs.unlinkSync(temp_dir + link_id)
                }
                catch(e){}
            }
            else
            {
                thumb_link_id = null;
            }
        }
        else
        {
            if(!await s3.is_file_exists(bucket_name + path, thumb_link_id))
            {
                let {file, content_type} = await download_from_s3(path, link_id);
                let thumbnail = await image_minimizer(file, {width: thumbnail_size}, {no_minimize: true});
                await upload_to_s3({path, id: thumb_link_id, meta, content_type: content_type, file_body: thumbnail});
            }
        }
    }
    else if (!file_data.thumb_link || file_data.link.indexOf("http") === 0)
    {
        if(!await s3.is_file_exists(bucket_name + path, thumb_link_id))
        {
            let {file, content_type} = await download_from_s3(path, link_id);
            let thumbnail;
            try {
                thumbnail = await image_minimizer(file, {width: thumbnail_size}, {no_minimize: true});
                await upload_to_s3({path, id: thumb_link_id, meta, content_type: content_type, file_body: thumbnail});
            }
            catch(e)
            {
                console.error(e);
                thumb_link_id = null
            }
        }
    }

    console.timeEnd("IMAGE");

    return {link_id, thumb_link_id}
};

module.exports = {
    upload_product_image
};