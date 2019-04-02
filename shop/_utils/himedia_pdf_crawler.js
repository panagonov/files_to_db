let fs            = require("fs");
let request       = require("request");
let utils         = require("../../_utils/utils.js");
let check_timeout = 60000;
let url           = "http://www.himedialabs.com/Catalogue/2018/files/assets/common/downloads/page{0}.pdf";
let temp_dir      = `${__dirname}/_download/`;

let cookies = request.jar();
let browser = request.defaults({proxy: "http://69.46.80.226:12361"});

let check_is = {
    "pdf" : async(url) =>
        new Promise((resolve, reject) => {

            let timeout = setTimeout(() => {
                timeout = null;
                console.error("File Check Timeout");
                resolve({confirm: false})
            }, check_timeout);

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

let download_file = async(url, target) =>
    new Promise((resolve, reject) => {
        let path = temp_dir + target;
        browser({
            method: "GET",
            url : url,
            headers : {'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36"},
            followAllRedirects: true,
            maxRedirects: 100,
            jar: cookies,
            strictSSL: false
        }).pipe(fs.createWriteStream(path))
        .on('error', function(err) {console.log(err); })
        .on("finish", function(err, res)
        {
            if (err) return reject(err);
            return resolve()
        });
    });


let crawler = async() => {
    for (let i = 1; i < 620; i++)
    {
        let page_number = utils.addZero(i, 4);
        let page_url = utils.format(url, page_number);

        if (await check_is.pdf(page_url))
        {
            console.log("file exists", page_number);
            await download_file(page_url, page_number + ".pdf");
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