let human_readable_id = str => str.replace(/\W/g, "_").replace(/\s/g, "_").replace(/_+/g, "_").replace(/^_/, "").replace(/_$/, "");

module.exports = {
    human_readable_id
};