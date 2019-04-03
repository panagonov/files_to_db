let fs = require("fs");
let directory_reader = require("../../_utils/directory_reader.js");
let utils = require("../../_utils/utils.js");

let himedia_pdf_crawler = require("./match_himedia_pdfs/himedia_pdf_crawler.js");
let product_id_collector = require("./match_himedia_pdfs/product_id_collector.js");
let pdf_text_extractor = require("./match_himedia_pdfs/pdf_text_extractor.js");
let text_finder = require("./match_himedia_pdfs/small_petko.js");

let download_dir = `${__dirname}/match_himedia_pdfs/_download`;


let find_id_matches = async (id_hash) => {

    let id_list =  Object.keys(id_hash);

    let pdf_hash = {};

    let pdfs = directory_reader(`${download_dir}/`, "pdf", {}, () => "");
    let count = Object.keys(pdfs).length;
    let page = 0;

    for (let key in pdfs)
    {
        let text = await pdf_text_extractor.run(`${download_dir}/${key}`);
        let matches = await text_finder.run(text, id_list);
        matches = utils.uniq(matches, item => item.match);

        if (matches.length){
            matches.forEach(({match}) =>
            {
                pdf_hash[match] = pdf_hash[match] || [];
                pdf_hash[match].push(key);
            });
        }

        page++;
        console.log(`${page}/${count}`);
    }

    fs.writeFileSync(__dirname + "/pdf_hash.json", JSON.stringify(pdf_hash), "utf8");

    return pdf_hash;
};

let run = async() =>
{
    await himedia_pdf_crawler.run({url : "http://www.himedialabs.com/Catalogue/2018/files/assets/common/downloads/page{0}.pdf", file_prefix: "himedia_catalogue_2018_", page_count: 616, download_dir: download_dir});
    let pdf_thumbs = await himedia_pdf_crawler.upload(download_dir, "ridacom_ltd","himedia_laboratories")
    // let id_hash = await product_id_collector.run();
    //
    // let pdf_hash = await find_id_matches(id_hash)
};


run()
.then(() => process.exit(0))
.catch(e => console.error(e));