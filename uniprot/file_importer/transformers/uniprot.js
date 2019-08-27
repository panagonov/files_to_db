let utils = require("../../../_utils/utils.js");

let mapping = {
    "_id"                 : record => record.accession instanceof Array ? record.accession.sort((a, b) => a < b ? -1 : 1).join("_") : record.accession,
    "ids"                 : record => record.accession instanceof Array ? record.accession : [record.accession],
    "name"                : ["protein.recommendedName.fullName.$text", "protein.recommendedName.fullName"],
    "aliases"             : record => (record.protein.alternativeName || [])
                                        .map(it => it.fullName)
                                        .concat(record.name || [])
                                        .map(item => item.$text || item),
    "gene"                : record => (record.gene || []).reduce((res,item) => {
                                res = res.concat(item.name.filter(it => it.$.type !== "ORF").map(it => it.$text));
                                return res;
                            }, []),
    "organism"            : record => (record.organism.name || []).map(it => it.$text),
    "ncbi_organism_tax_id": "organism.dbReference.$.id",
    "external_links"      : record => {
        return (record.dbReference || []).map(item  => {
            let res =  {
                key : utils.getValueFromJSON(item, "$.type"),
                id : utils.getValueFromJSON(item, "$.id"),
                type : utils.getValueFromJSON(item, "property.$.type"),
                value : utils.getValueFromJSON(item, "property.$.value"),
            };

            for (let key in res) {
                if (!res[key])
                    delete res[key];
            }
            return res
        })
    }
};

let transform = (record) =>
{
    if (!record.accession)
        return null;

    let result = utils.mapping_transform(mapping, record);
    return result
};

module.exports = {
    transform: transform,
    disable: false
};