let puppeteer       = require('puppeteer');

let default_settings = {
    check_timeout: 1200000,
    temp_dir     : `${__dirname}/_download/`
};

function HeadlessBrowser(){}

HeadlessBrowser.prototype.init = async function(options)
{
    this.options = Object.assign(default_settings, options || {});

    if (this.options.no_proxy)
    {
        this.browser = await puppeteer.launch({headless: this.options.headless});
    }
    else
    {
        this.proxy_settings = {server: "69.46.80.226:12360"};
        this.browser = await puppeteer.launch({
            headless: this.options.headless,
            args    : [ `--proxy-server=${this.proxy_settings.server}`,'--no-sandbox', '--disable-setuid-sandbox' ]
        });
    }

    this.page = await this.browser.newPage();
    await this.page.setViewport({width: 1600, height: 1000});
    // await this.page.setRequestInterception(true);

    if (this.proxy_settings && this.proxy_settings.authenticate)
        await this.page.authenticate(this.proxy_settings.authenticate);

    this.page.on("response", async (response) =>{
        this.file = await response.buffer();
    })
};

HeadlessBrowser.prototype.close = async function () {
    if (this.browser)
        await this.browser.close();

    this.browser = null;
    this.page = null;
};

HeadlessBrowser.prototype.on_file_loaded = async function () {
    return new Promise(resolve => {
        let interval = setInterval(() => {
            if (this.file)
            {
                clearInterval(interval);
                resolve(this.file);
                this.file = null;
            }
        }, 500)
    })
};

HeadlessBrowser.prototype.load = async function (url, types = []) {
    await this.page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36");

    try {
        let response = await this.page.goto(url, {waitUntil : "networkidle2", timeout: this.options.check_timeout});

        if (!response || types.indexOf(response._headers["content-type"]) === -1)
        {
            console.error("Download Error:",url);
            return {confirm: false}
        }
        let html = await this.on_file_loaded();

        let content_type = response && response._headers ? response._headers["content-type"].split(";")[0] : "";
        let headers = response && response._headers ? response._headers : {};
        return {confirm: true, html, content_type, headers}
    }
    catch (e) {
        console.error("load failed", url);
        return {}
    }
};

HeadlessBrowser.prototype.check_is = async function (url, types) {

    let timeout = setTimeout(() => {
        timeout = null;
        console.error("File Check Timeout");
       return {confirm: false}
    }, this.options.check_timeout);


    let {html, content_type, headers} = await this.load(url);

    if (timeout)
    {
        clearTimeout(timeout);

        if (types.indexOf(content_type) === -1)
        {
            return {confirm: false};
        }
        return {confirm: true, content_type: content_type, html: html}
    }
};

module.exports = HeadlessBrowser;