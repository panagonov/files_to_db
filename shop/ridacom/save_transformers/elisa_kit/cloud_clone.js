let utils        = require("../../../../_utils/utils.js");
let import_utils = require("../_utils.js");

let relation_fields = ["reactivity", "application", "test_method", "research_area", "supplier", "distributor"];

let _getImages = item => {
    let result = [];

    if(item.package_images && item.package_images.length)
    {
        item.package_images.forEach(link => result.push({link: link, type: "package"}))
    }
    if(item.images && item.images.length)
    {
        item.images.forEach(data => {
            if (typeof data === "string")
                result.push({link: data});
            else
            {
                result.push({link: data.link, text: data.text})
            }
        })
    }
    if(item.certificate && item.certificate.length)
    {
        {
            item.certificate.forEach(link => result.push({link: link, type: "certificate"}))
        }
    }

    return result.length ? result : null
};

let _getPdf = item =>
{
    let result = null;

    if(item.pdf)
    {
        result = [{
            link: item.pdf.link,
            ...item.pdf.preview ? {"thumb_link" : item.pdf.preview} : ""
        }]
    }

    return result;
};

let _getPriceModel = (item, crawler_item) =>
{
    let result = {
        ...crawler_item.price && crawler_item.price.length ? {"is_multiple" : true} : "",
        ...item.price.promotion ? {"discount" : {
                "default" : {
                    "type" : "percent",
                    "value" : item.price.promotion.discountPercentage
                }
            }} : "",
        "variation" :[]
    };

    let search_price = 0;
    if (crawler_item.price) {
        search_price = crawler_item.price[0];
    }
    if (item.price.promotion) {
        search_price = search_price * item.price.promotion.discountPercentage / 100;
    }

    search_price ? result.search_price = search_price : null;

    (crawler_item.price || []).forEach((price, index )=>
    {
        let size = import_utils.size_parser(crawler_item.size[index]);

        result.variation.push({
            "price" : {
                "value"   : price || 0,
                "currency": "usd",
            },
            "size"    : size
        })
    });

    return result;
};

let mapping_step1 = {
    "name"               : "name",
    "oid"                : "oid",
    "human_readable_id"  : record => import_utils.human_readable_id(record.name) + "_" + record.oid,
    "external_links"     : record => [{"key": "cloud_clone", "id": record.oid}],
    "bio_object"         : record => ({
        "type": "protein",
        ...record.item_name ? {"name": record.item_name} : "",
        ...record.aliases ? {"aliases": record.aliases} : ""
    }),
    "price_model"        : record => _getPriceModel(record, record.crawler_item),
    "supplier"           : record => import_utils.get_canonical("Cloud-Clone Corp.", ":supplier"),
    "distributor"        : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "reactivity"         : record => import_utils.get_canonical(record.reactivity.join("; "), [":host", ":reactivity"]),
    "application"        : record => import_utils.get_canonical((record.application || []).join("; "), ":application"),
    "research_area"      : record => import_utils.get_canonical((record.research_area || []).join("; ") || "", ":research_area"),
    "test_method"        : record => import_utils.get_canonical(record.method, ":test_method"),
    "shelf_life"         : "shelf_life",
    "usage"              : record => record["test_principle"] ? [record["test_principle"]] : null,
    "storage_conditions" : "storage_conditions",
    "delivery_conditions": "delivery_conditions",
    "images"             : record =>  _getImages(record.crawler_item),
    "pdf"                : record =>  _getPdf(record.crawler_item),
    "supplier_specific"  : record => ({
        "price" : record.supplier_specific.price,
    }),

    "sensitivity"       : "sensitivity",  //str
    "sample_type"       : "sample_type",  //arr
    "assay_length"      : "assay_length",  //str
    "specificity"       : "specificity",  //arr
    "precision"         : "precision",  //arr
    "stability"         : "stability",  //arr
    "procedure"         : "procedure",  //arr
};

let mapping_step2 = {
    "reactivity_relations"    : record => record.reactivity && record.reactivity.length? record.reactivity.map(([,key]) => key) : null,
    "application_relations"   : record => record.application && record.application.length? record.application.map(([,key]) => key) : null,
    "research_area_relations" : record => record.research_area && record.research_area.length ? record.research_area.map(([,key]) => key) : null,
    "test_method_relations"   : record => record.test_method && record.test_method.length ? record.test_method.map(([,key]) => key) : null,
    "supplier_relations"      : record => record.supplier && record.supplier.length ? record.supplier.map(([,key]) => key) : null,
    "distributor_relations"   : record => record.distributor && record.distributor.length ? record.distributor.map(([,key]) => key) : null,
    "ui"                      : record =>  relation_fields.reduce((res, field_name) => {
        if (record[field_name] && record[field_name].length)
            res[field_name] = record[field_name].map(([,,name]) => name);
        return res
    }, {}),

    "search_data": record =>
    {
        let result = [];

        let name_alias = record.name.split("(").pop().trim();

        if (name_alias.indexOf(")") !== -1)
        {
            result.push({key: "name", text : name_alias.replace(")", "").trim()});
        }

        if (record.bio_object.name)
        {
            result.push({key: "bio_object.name", text : record.bio_object.name})
        }

        (record.bio_object.aliases || []).forEach((alias, index) => {
            result.push({key: "bio_object.aliases." + index, text : alias})
        });

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

        return result
    }
};

let convert = (item, crawler_item) =>
{
    let record = Object.assign({}, item, {crawler_item: crawler_item});
    let result_step1 = utils.mapping_transform(mapping_step1, record);
    let result_step2 = utils.mapping_transform(mapping_step2, result_step1);
    let result = Object.assign(result_step1, result_step2);

    let suggest_data = import_utils.build_suggest_data_antibody_elisa_kit(result, relation_fields, "elisa_kit");

    relation_fields.forEach(name => delete result[name]);

    return {converted_item : result, suggest_data}
};

module.exports = {
    convert
};

// console.log(import_utils.get_canonical("Competitive Inhibition", [":test_method"]));