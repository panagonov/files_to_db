let human_readable_id = str => str.replace(/\W/g, "_").replace(/\s/g, "_").replace(/_+/g, "_").replace(/^_/, "").replace(/_$/, "");

let size_parser = size => {
    let match = /^([\d|\.]+)\s?([.|\S]+)\s?(.+)?/.exec(size);
    let value = match && match[1] ? parseFloat(match[1]) : 0;
    let dimension = match && match[2] ? match[2].trim() : "";
    let more_data = match && match[3] ? match[3].trim() : "";
    return {
        ...value ? {value: value} : "",
        ...dimension ? {dimension:dimension} : "",
        ...more_data ? {more_data: more_data} : "",
    }
};

module.exports = {
    human_readable_id,
    size_parser
};