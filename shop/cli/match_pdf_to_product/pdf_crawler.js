let fs               = require("fs");
let path             = require("path");
let utils            = require("../../../_utils/utils.js");
let s3               = require("../../../../bioseek/discovery/core/s3.js");
let directory_reader = require("../../../_utils/directory_reader.js");
let upload_pdf_utils = require("../../../_utils/upload_pdf_utils.js");

let default_url   = "http://www.himedialabs.com/Catalogue/2018/files/assets/common/downloads/page{0}.pdf";
let bucket_name   = "bioseek-shop/";


let himedia_laboratories_download = async({url, file_prefix = "", page_count = 616, download_dir}) => {
    url = url || default_url;

    await upload_pdf_utils.init({download_dir});

    for (let i = 1; i <= page_count; i++)
    {
        let page_number = utils.addZero(i, 4);
        let file_name = file_prefix + page_number + ".pdf";
        let dest = path.join(download_dir, file_name);
        let page_url = utils.format(url, page_number);

        if (fs.existsSync(dest))
            continue;

        let link_data = await upload_pdf_utils.check_is(page_url, ["application/pdf"]);

        if (link_data.confirm)
        {
            console.log("file exists", file_name);
            let {html} = await upload_pdf_utils.download_file(page_url, file_name);
            fs.writeFileSync(dest, html);
            console.log("download", file_name);
        }
        else
        {
            break;
        }
    }
};

let upload = async (dir_name, distributor, supplier) =>
{
    let thumb_path = `${dir_name}/pdf_thumbs.json`;
    let pdf_thumbs = {};

    if (fs.existsSync(thumb_path))
        pdf_thumbs = JSON.parse(fs.readFileSync(thumb_path, "utf8"));

    let pdfs = directory_reader(`${dir_name}/`, "pdf", {}, () => "");
    let s3_path = `pdf/${distributor}/${supplier}`;
    let s3_bucket_path = bucket_name + s3_path;

    let count = Object.keys(pdfs).length;
    let page = 0;
    let meta = {supplier: supplier, distributor: distributor};

    await upload_pdf_utils.init({download_dir : dir_name});

    for (let key in pdfs)
    {
        let file_name = `${key}.pdf`;
        if (pdf_thumbs[file_name]) {
            continue
        }

        if (!await s3.is_file_exists(s3_bucket_path, file_name))
        {
            await s3.upload({
                Bucket: s3_bucket_path,
                ContentType: "application/pdf",
                Body: fs.readFileSync(`${dir_name}/${file_name}`),
                Key: file_name,
                Metadata: meta
            });
        }

        let thumb_name = await upload_pdf_utils.upload_pdf_preview(s3_path, file_name, meta);
        if (thumb_name)
        {
            pdf_thumbs[file_name] = thumb_name
        }
        else {
            console.error("Thumb creating error", file_name)
        }

        page++;
        console.log(`Uploading ${key} - ${page}/${count}`)
    }

    fs.writeFileSync(thumb_path, JSON.stringify(pdf_thumbs), "utf8");

    return pdf_thumbs
};

module.exports = {
    himedia_laboratories_download,
    upload
};
//
// run({download_dir: `${__dirname}/_download/`})
// .then(() => process.exit(0))
// .catch(e => console.error(e));