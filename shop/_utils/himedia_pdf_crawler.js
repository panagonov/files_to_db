let utils = require("../../_utils/utils.js");
let url   = "http://www.himedialabs.com/Catalogue/2018/files/assets/common/downloads/page{0}.pdf";

let upload_pdf_utils = require("../../_utils/upload_pdf_utils.js");

let crawler = async() => {
    for (let i = 1; i < 620; i++)
    {
        let page_number = utils.addZero(i, 4);
        let page_url = utils.format(url, page_number);

        if (await upload_pdf_utils.check_is.pdf(page_url))
        {
            console.log("file exists", page_number);
            await upload_pdf_utils.download_file(page_url, page_number + ".pdf");
            console.log("download", page_number);
        }
        else
        {
            break;
        }
    }
};

crawler()
.then(() => process.exit(0))
.catch(e => console.error(e));