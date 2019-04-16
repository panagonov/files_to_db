let fs              = require("fs");
let path            = require("path");
let s3              = require("../../bioseek/discovery/core/s3.js");
let image_minimizer = require('../../bioseek/discovery/core/utilities/image_minimizer.js');
let exec            = require("child_process").exec;
let errors          = require("./pdf_errors.json");
let HeadlessBrowser = require("./headless_browser.js");
let RequestBrowser  = require("./request_browser.js");

let temp_dir = `${__dirname}/_download/`;
let bucket_name = "bioseek-shop/";
let browser        = null;


/**
 *
 * @param {Object} [options]
 * @param {String} [options.download_dir]
 */

let init = async (options = {}) => {
    temp_dir = options.download_dir || temp_dir;
};

let check_is = async(url, types = []) => {
    return await browser.check_is(url, types)
};

let download_file = async(url, file_name) => {
    return await browser.load(url, file_name)
};

let convert_pdf_to_image = async(source) =>
    new Promise((resolve, reject) =>
    {
        let dest = source.split(".").shift();
        exec(`pdftopng -r 72 -f 1 -l 1 "${source}" "${dest}"`, (err, result) =>
        {
            if (err)
                return reject(err);

            resolve(dest);
        })
    });

let upload_to_s3 = async({path, id, meta = {}, content_type, file_body}) =>
{
    await s3.upload({
        Bucket: bucket_name + path,
        ContentType: content_type,
        Body: file_body || fs.readFileSync(temp_dir + id),
        Key: id,
        Metadata: meta
    });
    return id
};

let s3_check_is_file_exists = async(path, id) =>
    await s3.is_file_exists(bucket_name + path, id);

let download_from_s3 = async(path, id) =>
{
    let res = await s3.download(bucket_name + path, id);
    fs.writeFileSync(temp_dir + id, new Buffer.from(res.Body))
};

let generate_pdf_preview = async (file_name) =>
{
    await convert_pdf_to_image(path.join(temp_dir,file_name));
    let thumb_name = file_name.split(".").shift() + "-000001.png";

    let fileBody = fs.readFileSync(path.join(temp_dir,thumb_name));
    let compressed_image = await image_minimizer(fileBody, {width: 200});

    return {preview_file_name : thumb_name, compressed_image};
};

let upload_pdf_preview = async(path, file_name, meta) => {

    let thumb_name = "";
    try
    {
        let {preview_file_name, compressed_image} = await generate_pdf_preview(file_name);
        thumb_name = preview_file_name;

        await upload_to_s3({path, id: thumb_name, meta, content_type: "image/png", file_body: compressed_image});
        try {
            fs.unlinkSync(temp_dir + thumb_name);
        }
        catch (e){}

    } catch (e)
    {
        errors.push(id);
        fs.writeFileSync(__dirname + "/pdf_errors.json", JSON.stringify(errors), "utf8");
        console.error(e)
    }

    return thumb_name
};

/**
 *
 * @param {String} link
 * @param {String} path
 * @param {String} file_name
 * @param {Object} [meta]
 * @param {Object} [options]
 * @param {Boolean} [options.force] - force file download
 * @returns {Promise<{link_id: string, thumb_link_id: string}>}
 */
let upload_product_pdf = async({link, path, file_name, meta = {}, options = {}}) => {
    file_name = decodeURIComponent(file_name).replace(/\W|\s/, "_")
    if (!browser)
    {
        browser = new RequestBrowser();
        await browser.init();
    }

    let link_id = "";
    let thumb_link_id = "";

    console.time("PDF");

    let file_exists = options.force ? false : await s3.is_file_exists(bucket_name + path, file_name);

    if (!file_exists)
    {
        link = link.replace(".co.uk", ".com");
        let check_file_data = await browser.load(link, ["application/pdf"]);

        if (check_file_data.confirm)
        {
            let html = check_file_data.html;
            if (html)
            {
                fs.writeFileSync(temp_dir + file_name, html);
                thumb_link_id = await upload_pdf_preview(path, file_name, meta);

                await upload_to_s3({path, id: file_name, meta, content_type: check_file_data.content_type});
                link_id = file_name;

                fs.unlinkSync(temp_dir + file_name);
            }
        }
    }
    else
    {
        link_id = file_name;
        thumb_link_id = file_name.split(".").shift() + "-000001.png";

        let thumb_exists = options.force ? false : await s3.is_file_exists(bucket_name + path, thumb_link_id);

        if(!thumb_exists) {
            let {file, content_type, error} = await download_from_s3(path,file_name);
            if (error){
                console.error("13 download error");
                link_id = "";
                thumb_link_id = "";
            }
            else
            {
                thumb_link_id = await upload_pdf_preview(path, file_name, meta);
                fs.unlinkSync(temp_dir + file_name);
            }
        }
    }

    console.timeEnd("PDF");

    return {link_id, thumb_link_id}
};


module.exports = {
    upload_product_pdf,
    check_is,
    download_file,
    init,
    upload_pdf_preview,
    s3_check_is_file_exists
};