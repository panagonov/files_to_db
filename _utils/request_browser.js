let fs      = require("fs");
let request = require("request");

let default_settings = {
    check_timeout: 60000,
    temp_dir     : `${__dirname}/_download/`
};

function RequestBrowser(){}

/**
 *
 * @param {Object} [options]
 * @param {String} [options.temp_dir]
 * @param {Number} [options.check_timeout] - in ms
 * @param {Boolean} [options.no_proxy] - in ms
 * @returns {Promise<void>}
 */
RequestBrowser.prototype.init = async function(options) {
    this.options = Object.assign(default_settings, options || {});
    this.cookies = request.jar();

    if (this.options.no_proxy)
    {
        this.browser = request.defaults({});
    }
    else
    {
        this.browser = request.defaults({/*proxy: "http://69.46.80.226:12368"*/});
    }
};

RequestBrowser.prototype.close = async function() {

};

RequestBrowser.prototype.load = async function(url, types = []) {
    return new Promise((resolve, reject) => {

        let timeout = setTimeout(() => {
            timeout = null;
            console.error("File Check Timeout");
            resolve({confirm: false})
        }, this.options.check_timeout);

        this.browser({
            method: "GET",
            url : url,
            headers : {'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36"},
            followAllRedirects: true,
            maxRedirects: 100,
            jar: this.cookies,
            strictSSL: false,
            encoding: null
        }, (err, response, body) =>
        {
            if (!timeout)
                return;

            clearTimeout(timeout);

            if ( err || response.statusCode === 404 || types.indexOf(response.headers["content-type"]) === -1 ){
                console.error("Download Error:",url)
                return resolve({confirm: false});
            }

            let content_type = response.headers["content-type"];
            // let html = new Buffer.from(body, "base64")
            resolve ({confirm: true, html : body, content_type: content_type});
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