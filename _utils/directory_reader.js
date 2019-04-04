let fs                  = require('fs');

/**
 *
 * @param {String} path
 * @param {String} file_type - "js", "css"
 * @param {Object} options - "js", "css"
 * @param {Boolean} [options.recursive] - if true load sub directories
 * @param {Boolean} [options.flat_recursive_tree] - return flat object - files with a same names in a different directories will be overlap!!!
 * @param {Number} [options.recursive_dept] - number of recursive cycles - if missing -> infinity
 * @param {Array} [options.allowFilesList] - list of file names without extensions
 * @param {Array} [options.denyFilesList] - list of file names without extensions
 * @param {Number} [options.current_recursive_step] - service info don't use!!!
 * @param {Function} [transformFn] - transform file content
 * @returns {Object} - key = fileName, value = file content
 */

let readFiles = (path, file_type, options = {}, transformFn) => {
    if (!fs.existsSync(path)) return {};

    let filesList = fs.readdirSync(path);
    let result = {};

    filesList.forEach((fileName) => {

        let file = path + fileName;

        if (fs.lstatSync(file).isDirectory()) {
            if (options.recursive) {
                let rec_options = JSON.parse(JSON.stringify(options));
                rec_options.current_recursive_step = options.current_recursive_step || 0;
                if (!rec_options.recursive_dept || rec_options.recursive_dept > rec_options.current_recursive_step)
                {
                    rec_options.current_recursive_step++;
                    let res = readFiles(file + "/", file_type, rec_options);
                    if (options.flat_recursive_tree)
                        result = Object.assign(result, res);
                    else
                        result[fileName] = readFiles(file + "/", file_type, rec_options);
                }
            }
            return
        }
        let name = fileName.split(".").shift();
        let type = fileName.split(".").pop();
        if (type === file_type) {
            if (options.denyFilesList && options.denyFilesList.indexOf(fileName) !== -1)
                return;

            if (!options.allowFilesList || (options.allowFilesList && options.allowFilesList.length && options.allowFilesList.indexOf(name) !== -1))
            {
                result[name] = transformFn ? transformFn(fileName, file) : require(file);
            }
        }
    });

    return result;
};
module.exports = readFiles;