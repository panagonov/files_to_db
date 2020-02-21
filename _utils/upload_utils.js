let fs              = require("fs");
let exec            = require("child_process").exec;
let s3              = require("../../bioseek/bioseek/core/s3.js");
let image_minimizer = require('../../bioseek/bioseek/core/utilities/image_minimizer.js');
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



let convert_to_jpg = async(content) => {
    let file_name = temp_dir + "convert.tmp";
    let output_name =  temp_dir + "out.jpg";

    fs.writeFileSync(file_name, content);
    await new Promise((resolve, reject) => {
        exec(`magick convert ${file_name} -quality 92 ${output_name}`, (err, res) => {
            if (err) {
                console.error(err);
                return reject(err);
            }
            resolve()
        })
    });
    let result = fs.readFileSync(output_name);
    fs.unlinkSync(file_name);
    fs.unlinkSync(output_name);
    return result
}
/**
 *
 * @param {String} link
 * @param {String} path
 * @param {String} product_id
 * @param {Number} file_index
 * @param {Object} [meta]
 * @param {Object} [options]
 * @param {Object} [file_content]
 * @param {Buffer} [file_content.html]
 * @param {String} [file_content.content_type]
 * @param {Boolean} [file_content.confirm]
 *
 * @param {Boolean} [options.force] - force file download
 * @returns {Promise<{link_id: string, thumb_link_id: string}>}
 */
let upload_product_image = async({link, path, product_id, file_index, meta = {}, options = {}, file_content}) => {
    if (!browser)
    {
        browser = new RequestBrowser();
        await browser.init({headless: false});
    }

    let link_id = product_id.replace(/\W/g, "_") + "_" + file_index;
    let thumb_link_id = link_id + "_thumb_" + thumbnail_size;

    console.time("IMAGE " + product_id);

    let file_exists = options.force ? false : await s3.is_file_exists(bucket_name + path, link_id);

    if (!file_exists)
    {
        link ? link = link.replace("/500x/", "/x800/")/*.replace(".co.uk", ".com")*/ : null;
        let check_file_data = file_content || await browser.load(link, ["image/png", "image/jpg", "image/jpeg", "image/gif", "image/bmp"]);

        if (check_file_data.confirm && check_file_data.html.length)
        {
            let html = check_file_data.html;

            if (["image/png", "image/jpg", "image/jpeg"].indexOf(check_file_data.content_type) === -1)
            {
                html = await convert_to_jpg(check_file_data.html);
                check_file_data.content_type = "image/jpeg"
            }

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