let semantica    = require("../../../common-components/search-engine-3/domains/genetics/index.js");

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

let get_canonical = (text, type) =>
{
    if (typeof type === "string")
        type = [type];

    let db = semantica.getDb();
    let atoms = semantica.analyseSpeech("eng", text);

    atoms = atoms
    .filter(([atom_type]) => type.indexOf(atom_type) !== -1)
    .map(atom => {
        let synonyms = semantica.knowledge.findTagsByCanonical(db, atom[1]);
        if (synonyms && synonyms.length)
        {
            atom.push(synonyms);
        }

        return atom
    });
    return atoms
};

let build_suggest_data_antibody_elisa_kit = (record, relation_fields, category) => {
    let result = {};

    let separate_aliases_and_synonyms = (data) =>
    {
        let max_alias_length = 5;
        let aliases = data.filter(item => item.length <= max_alias_length);
        let syn = data.filter(item => item.length > max_alias_length);
        return {aliases, syn}
    };

    if (record.bio_object.name)
    {
        let id = `protein_${human_readable_id(record.bio_object.name)}`;
        let all_aliases = record.bio_object.aliases || [];

        let name_alias = record.name.split("(").pop().trim();

        if (name_alias.indexOf(")") !== -1)
            all_aliases.push(name_alias.replace(")", "").trim());

        let  {aliases, syn} = separate_aliases_and_synonyms(all_aliases);

        result[id] = {
            type    : "protein",
            category: [category],
            name    : record.bio_object.name,
            ...aliases.length ? {aliases : aliases} : "",
            ...syn.length ? {synonyms : syn} : ""
        }
    }

    relation_fields.forEach(field_name =>
    {
        if (!record[field_name] || !record[field_name].length)
            return;

        record[field_name].forEach(([,key,name,,synonyms]) => {
            if (!name || !name.trim())
                return;

            let id = `${field_name}_${key}`;
            let all_aliases = (synonyms || []).map(({name}) => name);
            let  {aliases, syn} = separate_aliases_and_synonyms(all_aliases);

            result[id] = {
                type    : field_name,
                category: [category],
                name    : name,
                ...aliases.length ? {aliases : aliases} : "",
                ...syn.length ? {synonyms : syn} : ""
            };
        })
    });

    return result
};

module.exports = {
    human_readable_id,
    size_parser,
    get_canonical,
    build_suggest_data_antibody_elisa_kit
};

// let test = (text) =>
// {
//     let db = semantica.getDb();
//     let res = semantica.analyseSpeech("eng", text);
//     // let parents = semantica.knowledge.getTagParents(db, res[0][1]);
//     console.log(res)
//     debugger
// };

// console.log(test("Loading Control of WB" ))

// console.log(get_canonical("Rat CHO Guinea pig E.coli 293F Mouse Rabbit n/a null", [":host", ":reactivity"]));