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

let semantica_process_hash = {};

let get_semantica_process = (types) =>
{
    let key = types.sort((a,b) => a < b ? -1 : 1).join("_");
    if (semantica_process_hash[key])
        return semantica_process_hash[key];

    let phases = [":stop_word"].concat(types, ["atom_name"]).map(phase_name => semantica.phases_data[phase_name]);
    semantica_process_hash[key] = semantica.generateCustomProcess(phases);

    return semantica_process_hash[key]
};

let get_semantica_results = (text, types) =>
{
    let db = semantica.getDb();
    let custom_process = get_semantica_process(types);
    let atoms = semantica.analyseSpeech("eng", text, custom_process);

    return {atoms, db}
};

let get_canonical = (text, type) =>
{
    if (typeof type === "string")
        type = [type];

    let {atoms, db} = get_semantica_results(text, type);

    atoms = atoms.reduce((res, atom) => {
        if (!res.some(item => item[1] === atom[1]))
            res.push(atom);

        return res;
    }, [])
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

    let name_alias = record.name.split("(").pop().trim();

    if (name_alias.indexOf(")") !== -1)
    {
        let alias = name_alias.replace(")", "").trim();
        let _id = human_readable_id(alias);
        if (result[_id])
            result[_id].type.push(category);
        else
        {
            result[_id] = {
                type    : [category],
                category: [category],
                name    : alias
            }
        }
    }

    if (record.bio_object && record.bio_object.length)
    {
        record.bio_object.forEach(bio_object =>{
            if (!bio_object.name)
                return;

            let id = human_readable_id(bio_object.name);
            let all_aliases = bio_object.aliases || [];

            let  {aliases, syn} = separate_aliases_and_synonyms(all_aliases);

            if (result[id])
                result[id].type.push("protein");
            else
                {
                result[id] = {
                    type    : ["protein"],
                    category: [category],
                    name    : bio_object.name,
                    ...aliases.length ? {aliases : aliases} : "",
                    ...syn.length ? {synonyms : syn} : ""
                }
            }
        })
    }

    relation_fields.forEach(field_name =>
    {
        if (!record[field_name] || !record[field_name].length)
            return;

        record[field_name].forEach(([,key,name,,synonyms]) => {
            if (!name || !name.trim())
                return;

            let id = key;
            let all_aliases = (synonyms || []).map(({name}) => name);
            let  {aliases, syn} = separate_aliases_and_synonyms(all_aliases);

            if (result[id])
                result[id].type.push(field_name);
            else {
                result[id] = {
                    type    : [field_name],
                    category: [category],
                    name    : name,
                    ...aliases.length ? {aliases : aliases} : "",
                    ...syn.length ? {synonyms : syn} : ""
                };
            }
        })
    });

    return result
};

let build_search_data = (record, relation_fields) =>
{
    let result = [];

    let name_alias = record.name.split("(").pop().trim();

    if (name_alias.indexOf(")") !== -1)
    {
        result.push({key: "name", text : name_alias.replace(")", "").trim()});
    }

    if (record.bio_object && record.bio_object.length)
    {
        record.bio_object.forEach((bio_object,index) =>
        {
            if (bio_object.name)
            {
                result.push({key: `bio_object.${index}.name`, text : bio_object.name})
            }

            (bio_object.aliases || []).forEach((alias, ind) => {
                result.push({key: `bio_object.${index}.aliases.${ind}`, text : alias})
            });

            (bio_object.gene || []).forEach((alias, ind) => {
                result.push({key: `bio_object.${index}.gene.${ind}`, text : alias})
            });
            (bio_object.ids || []).forEach((alias, ind) => {
                result.push({key: `bio_object.${index}.uniprot_id.${ind}`, text : alias})
            });
        })
    }

    relation_fields.forEach(field_name =>
    {
        if (!record[field_name] || !record[field_name].length)
            return;

        record[field_name].forEach(([,,name,,synonyms],index) => {
            if (!name || !name.trim())
                return;
            result.push({key: `${field_name}.${index}`, text : name});
            if (synonyms && synonyms.length)
            {
                synonyms.forEach(({name}) => {
                    result.push({key: `${field_name}.${index}`, text : name})
                })
            }
        })
    });

    (record.aliases || []).forEach((alias, ind) => {
        result.push({key: `aliases.${ind}`, text : alias})
    });

    return result
};

let build_service_data = (record, relation_fields) => {

    let result = {};
    relation_fields.forEach(field_name =>
        record[field_name] && record[field_name].length ? result[field_name + "_relations"] =  record[field_name].map(([,key]) => key) : null
    );

    result["ui"] = relation_fields.reduce((res, field_name) => {
        if (record[field_name] && record[field_name].length)
            res[field_name] = record[field_name].map(([,,name]) => name);
        return res
    }, {});

    result["search_data"] = build_search_data(record, relation_fields);

    return result
};

module.exports = {
    human_readable_id,
    size_parser,
    get_canonical,
    build_suggest_data_antibody_elisa_kit,
    build_search_data,
    build_service_data
};

// console.log(get_canonical("Baculovirus-Insect Cells", [":preparation_method"]));