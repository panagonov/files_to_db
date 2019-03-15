let fs              = require("fs");
let request         = require("request");
let uuid            = require("uuid/v4");
let s3              = require("../../bioseek/discovery/core/s3.js");
let image_minimizer = require('../../bioseek/discovery/core/utilities/image_minimizer.js');
let exec            = require("child_process").exec;

let temp_dir = `${__dirname}/_download/`;
let bucket_name = "bioseek-shop/";
let check_timeout = 20000;

let cookies = request.jar();
let browser = request.defaults({proxy: "http://69.46.80.226:12361"});

let check_is = {
    "pdf" : async(url) =>
        new Promise((resolve, reject) => {

            let timeout = setTimeout(() => {
                timeout = null;
                resolve({confirm: false})
            }, check_timeout);
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
        exec(`pdftopng -r 72 -f 1 -l 1 "${source}" "${dest}"`, (err, result) =>
        {
            if (err)
                return reject(err);

            resolve(dest);
        })
    });


let download_file = async(url, target) =>
    new Promise((resolve, reject) => {
        let path = temp_dir + target;
        url = url.replace(".co.uk", ".com");
        browser(url).pipe(fs.createWriteStream(path)).on("close", function(err, res)
        {
            if (err) return reject(err);
            resolve (fs.readFileSync(path));
        });
    });

let is_file_exists = async (path, id) =>
    await s3.is_file_exists(bucket_name + path, id);

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

let download_from_s3 = async(path, id) =>
{
    let res = await s3.download(bucket_name + path, id);
    fs.writeFileSync(temp_dir + id, new Buffer.from(res.Body))
};

let generate_pdf_preview = async (file_name) =>
{
    await convert_pdf_to_image(temp_dir + file_name);
    let thumb_name = file_name.split(".").shift() + "-000001.png";

    let fileBody = fs.readFileSync(temp_dir + thumb_name);
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
        console.error(e)
    }

    return thumb_name
};

let upload_product_pdf = async({file_data, path, file_name, image_index, meta = {}}) => {

    let thumb_name = "";
    let link_name = "";

    console.time("Start PDF");
    try
    {
        if (file_data.link)
        {
            let file_exists = await is_file_exists(path, file_name);
            if (!file_exists)
            {
                let link_data = await check_is.pdf(file_data.link);

                if (link_data.confirm)
                {
                    await download_file(file_data.link, file_name);
                    thumb_name = await upload_pdf_preview(path, file_name, meta);

                    await upload_to_s3({path, id: file_name, meta, content_type: link_data.content_type});
                    link_name = file_name;

                    fs.unlinkSync(temp_dir + file_name);
                }
            }
            else
            {
                link_name = file_name;
                thumb_name = file_name.split(".").shift() + "-000001.png";

                if(!await is_file_exists(path, thumb_name)) {
                    await download_from_s3(path,file_name);
                    thumb_name = await upload_pdf_preview(path, file_name, meta);

                    fs.unlinkSync(temp_dir + file_name);
                }
            }
        }
    }
    catch(e) {

    }
    console.timeEnd("Start PDF");

    return {link_name, thumb_name}
};


module.exports = {
    upload_product_pdf
};