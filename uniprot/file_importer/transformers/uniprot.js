let utils = require("../../../_utils/utils.js");

let hash = {};

const knownOrganisms = [
    "Felis catus",
    "Gallus gallus",
    "Pan troglodytes",
    "Canis familiaris",
    "Drosophila melanogaster",
    "Homo sapiens",
    "Mus musculus",
    "Pongo pygmaeus",
    "Sus scrofa",
    "Fugu rubripes",
    "Tetraodon nigroviridis",
    "Oryctolagus cuniculus",
    "Rattus norvegicus",
    "Caenorhabditis elegans",
    "Saccharomyces cerevisiae",
    "Schizosaccharomyces pombe",
    "Danio rerio"
];

let mapping = {
    "_id"                 : record => {
        let genes =(record.gene || []).reduce((res,item) => {
            res = res.concat(item.name.filter(it => it.$.type !== "ORF").map(it => it.$text));
            return res;
        }, []);
        if (genes && genes.length) {
            return `GENE:NCBI:${genes[0].toUpperCase()}`
        }
        return null;
    },
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
    "gene_symbol"         : record => (record.gene || []).reduce((res,item) => {
                                    res = res.concat(item.name.filter(it => it.$.type !== "ORF").map(it => it.$text));
                                    return res;
                                }, [])[0],
    "organism"            : record => (record.organism.name || [])
                                        .map(it => it.$text.trim())
                                        .filter(name => knownOrganisms.indexOf(name) !== -1),
    "description"         : record => {
                                    let result = null;
                                    if (record.comment) {
                                        result = record.comment.filter(item => item["$"].type === "function")
                                        .map(item => item.text.$text);
                                        if (result.length)
                                            return result
                                    }
                                    return null
                                },
    "ncbi_organism_tax_id": "organism.dbReference.$.id",
    "date_created"        : record => record["$"] && record["$"].created ? new Date(record["$"].created).toISOString() : null,
    "date_updated"        : record => record["$"] && record["$"].modified ? new Date(record["$"].modified).toISOString() : null,
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

let manage_hash = result => {
    hash[result._id] = hash[result._id] || {};
    if (result.aliases)
        hash[result._id].aliases = utils.uniq((hash[result._id].aliases || []).concat(result.aliases));
    if (result.gene)
        hash[result._id].gene = utils.uniq((hash[result._id].gene || []).concat(result.gene));
    if (result.organism)
        hash[result._id].organism = utils.uniq((hash[result._id].organism || []).concat(result.organism))
};

let enrich_result = result => {
    if (hash.hasOwnProperty(result._id)) {
        return Object.assign({}, result, hash[result._id])
    }
    return result;
};

let transform = (record) =>
{
    if (!record.accession)
        return null;

    let result = utils.mapping_transform(mapping, record);

    if (!result.organism || !result.organism.length)
        return null;

    if (!result._id)
        return null;

    manage_hash(result);
    result = enrich_result(result);

    return result
};

module.exports = {
    transform: transform,
    disable: false
};
