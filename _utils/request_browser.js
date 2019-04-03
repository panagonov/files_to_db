let fs      = require("fs");
let request = require("request");

let default_settings = {
    check_timeout: 60000,
    temp_dir     : `${__dirname}/_download/`
};

function RequestBrowser(){

}

/**
 *
 * @param {Object} [options]
 * @param {String} [options.temp_dir]
 * @param {Number} [options.check_timeout] - in ms
 * @param {Boolean} [options.no_proxy] - in ms
 * @returns {Promise<void>}
 */
RequestBrowser.prototype.init = async function(options) {
    this.options = options || default_settings;
    this.cookies = request.jar();

    if (this.options.no_proxy)
    {
        this.browser = request.defaults({});
    }
    else
    {
        this.browser = request.defaults({proxy: "http://69.46.80.226:12368"});
    }
};


RequestBrowser.prototype.close = async function() {

};

RequestBrowser.prototype.load = async function(url, target) {
    return new Promise((resolve, reject) => {
        let path = this.options.temp_dir + target;

        this.browser({
            method: "GET",
            url : url,
            headers : {'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36"},
            followAllRedirects: true,
            maxRedirects: 100,
            jar: this.cookies,
            strictSSL: false
        }).pipe(fs.createWriteStream(path)).on("close", function(err, res)
        {
            if (err){
                console.error("Browser Load Error", err);
                return resolve({html: null});
            }
            let html = fs.readFileSync(path);
            fs.unlinkSync(path);
            resolve ({html : html});
        });
    });
};

RequestBrowser.prototype.check_is = async function(url, types = []) {
    return new Promise((resolve, reject) =>{
        let timeout = setTimeout(() => {
            timeout = null;
            console.error("File Check Timeout");
            resolve({confirm: false})
        }, this.options.check_timeout);

        this.browser.get({
            method: "HEAD",
            url: url,
            headers : {'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36"},
            followAllRedirects: true,
            maxRedirects: 100,
            jar: this.cookies,
            strictSSL: false
        }, (err, response, body) => {

            if (!timeout)
                return;

            clearTimeout(timeout);

            if ( err || response.statusCode === 404 || types.indexOf(response.headers["content-type"]) === -1 )
                return resolve({confirm: false});
            resolve({confirm: true, content_type: response.headers["content-type"]})
        })
    })
};

module.exports = RequestBrowser;