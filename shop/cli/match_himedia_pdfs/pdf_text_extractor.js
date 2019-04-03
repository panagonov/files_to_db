let fs               = require("fs");
let exec             = require("child_process").exec;

let extract_pdf_text = async(source) =>
    new Promise((resolve, reject) => {
        exec(`pdftotext ${source} -`, (err, result) =>
        {
            if (err){
                console.error("PDF to Text", err);
                return resolve("");
            }
            resolve(result.replace(/(\f|\n|\r)/g," ").trim());
        })
    });

let run = async (path) =>
{
    if (fs.existsSync(`${path}.text`))
    {
        return fs.readFileSync(`${path}.text`, "utf8");
    }

    let text = await extract_pdf_text(`${path}.pdf`);
    fs.writeFileSync(`${path}.text`, text, "utf8");
    return text
};

module.exports = {
    run
};