let fs                  = require('fs');

/**
 *
 * @param {String} path
 * @param {String} file_type - "js", "css"
 * @param {Boolean} [recursive] - if true load sub directories
 * @param {Array} [allowFilesList] - list of file names without extensions
 * @param {Function} [transformFn] - transform file content
 * @returns {Object} - key = fileName, value = file content
 */

let readFiles = (path, file_type, recursive, allowFilesList, transformFn) => {
    if (!fs.existsSync(path)) return {};

    let filesList = fs.readdirSync(path);
    let result = {};

    filesList.forEach((fileName) => {

        let file = path + fileName;

        if (fs.lstatSync(file).isDirectory()) {
            if (recursive) {
                return result[fileName] = readFiles(file + "/", file_type, recursive, allowFilesList);
            }
            return
        }
        let name = fileName.split(".").shift();
        let type = fileName.split(".").pop();
        if (type === file_type) {
            if (!allowFilesList || (allowFilesList && allowFilesList.length && allowFilesList.indexOf(name) !== -1))
            {
                result[name] = transformFn ? transformFn(fileName, file) : require(file);
            }
        }
    });

    return result;
};
module.exports = readFiles;