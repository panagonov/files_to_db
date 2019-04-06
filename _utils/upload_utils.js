let fs              = require("fs");
let request         = require("request");
let s3              = require("../../bioseek/discovery/core/s3.js");
let image_minimizer = require('../../bioseek/discovery/core/utilities/image_minimizer.js');
let errors          = require("./errors.json");
let HeadlessBrowser = require("./headless_browser.js");
let RequestBrowser  = require("./request_browser.js");

let temp_dir       = `${__dirname}/_download/`;
let bucket_name    = "bioseek-shop/";
let thumbnail_size = 100; //width in pixels
let browser        = null;

/**
 *
 * @param {Object} options
 * @param {String} options.download_dir
 */

let init = (options) => {
    temp_dir = options.download_dir || temp_dir
};

let download_from_s3 = async(path, id) =>
{
    try {
        let res = await s3.download(bucket_name + path, id);
        return {file: res.Body, content_type : res.ContentType}

    }
    catch(e)
    {
        errors.push(id);
        fs.writeFileSync(__dirname + "/errors.json", JSON.stringify(errors), "utf8");
        return {error: e}
    }
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

let s3_check_is_file_exists = async(path, id) =>
    await s3.is_file_exists(bucket_name + path, id);
/**
 *
 * @param {String} link
 * @param {String} path
 * @param {String} product_id
 * @param {Number} file_index
 * @param {Object} [meta]
 * @param {Object} [options]
 * @param {Boolean} [options.force] - force file download
 * @returns {Promise<{link_id: string, thumb_link_id: string}>}
 */
let upload_product_image = async({link, path, product_id, file_index, meta = {}, options = {}}) => {
    if (!browser)
    {
        browser = new RequestBrowser();
        await browser.init();
    }

    let link_id = product_id.replace(/\W/g, "_") + "_" + file_index;
    let thumb_link_id = link_id + "_thumb_" + thumbnail_size;

    console.time("IMAGE " + product_id);

    let file_exists = options.force ? false : await s3.is_file_exists(bucket_name + path, link_id);

    if (!file_exists)
    {
        link = link.replace("/500x/", "/x800/")/*.replace(".co.uk", ".com")*/;
        let check_file_data = await browser.load(link, ["image/png", "image/jpg", "image/jpeg", "image/gif"]);

        if (check_file_data.confirm)
        {
            let html = check_file_data.html;
            if (html)
            {
                let compressed_image = html; // await image_minimizer(file);
                await upload_to_s3({path, id: link_id, meta, content_type: check_file_data.content_type, file_body: compressed_image});

                try {
                    let thumbnail = await image_minimizer(compressed_image, {width: thumbnail_size});
                    await upload_to_s3({path, id: thumb_link_id, meta, content_type: check_file_data.content_type, file_body: thumbnail});
                }
                catch(e){
                    thumb_link_id = null;
                    console.error("1 thumb error")
                }
            }
            else
            {
                link_id = null;
                thumb_link_id = null;
            }
        }
        else
        {
            link_id = null;
            thumb_link_id = null;
        }
    }
    else
    {
        let thumb_exists = options.force ? false : await s3.is_file_exists(bucket_name + path, thumb_link_id);

        if(!thumb_exists)
        {
            let {file, content_type, error} = await download_from_s3(path, link_id);
            if (error){
                console.error("13 download error");
                link_id = null;
                thumb_link_id = null;
            }
            else {
                try {
                    let thumbnail = await image_minimizer(file, {width: thumbnail_size});
                    await upload_to_s3({path, id: thumb_link_id, meta, content_type: content_type, file_body: thumbnail});
                }
                catch(e){
                    console.error("2 thumb error");
                    thumb_link_id = null;
                }
            }
        }
    }

    console.timeEnd("IMAGE " + product_id);

    return {link_id, thumb_link_id}
};

module.exports = {
    upload_product_image,
    init,
    s3_check_is_file_exists
};