let utils        = require("../../../../_utils/utils.js");
let import_utils = require("../_utils.js");

let relation_fields = ["supplier", "distributor", "reactivity", "preparation_method", "application", "research_area"];



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

    return  result.length ? result : null
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

    let search_price = item.price ? item.price.value || 0 : 0;

    search_price ? result.search_price = search_price : null;

    (crawler_item.price || []).forEach((price, index )=> {
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

let mapping = {
    "name"               : "name",
    "oid"                : "oid",
    "human_readable_id"  : record => import_utils.human_readable_id(record.name) + "_" + record.oid,
    "external_links"     : record => [{"key": "cloud_clone", "id": record.oid}],
    "bio_object"         : record => [{
        "type": "protein",
        ...record.item_name ? {"name": record.item_name} : "",
        ...record.aliases ? {"aliases": record.aliases} : ""
    }],
    "price_model"        : record => _getPriceModel(record, record.crawler_item),
    "supplier"           : record => import_utils.get_canonical("Cloud-Clone Corp.", ":supplier"),
    "distributor"        : record => import_utils.get_canonical("RIDACOM Ltd.", ":distributor"),
    "preparation_method" : record => import_utils.get_canonical(record.host || "", [":host", ":reactivity", ":preparation_method"]),
    "reactivity"         : record => import_utils.get_canonical(record.reactivity.join("; "), [":host", ":reactivity"]),
    "application"        : record => import_utils.get_canonical(record.application.join("; "), ":application"),
    "research_area"      : record => import_utils.get_canonical((record.research_area || []).join("; ") || "", ":research_area"),
    "purity"                    : "purity",
    "fragment"                  : "fragment",                   //add str
    "molecular_weight"          : "a_mol_mass",
    "molecular_weight_predicted": "p_mol_mass",                 //add str
    "shelf_life"                : "shelf_life",
    "storage_conditions"        : "storage_conditions",
    "delivery_conditions"       : "delivery_conditions",
    "subcell_location"          : "subcell_location",           //add str
    "endotoxin_level"           : "endotoxin_level",            //add str
    "buffer_form"               : "buffer_form",                //add str
    "source"                    : "traits",                     //add str
    "tag"                       : "tag",                        //add str
    "traits"                    : "traits",                     //add str
    "isoelectric_point"         : "isoelectric_point",          //add float
    "images"             : record =>  _getImages(record.crawler_item),
    "pdf"                : record =>  _getPdf(record.crawler_item),
    "original_link"      : "link",
    "distributor_only" : record => ({
        "price" : record.supplier_specific.price
    })
};

let convert = (item, crawler_item) =>
{
    let record = Object.assign({}, item, {crawler_item: crawler_item});

    let result = utils.mapping_transform(mapping, record);
    let service_data = import_utils.build_service_data(result, relation_fields);
    result = Object.assign(result, service_data);

    let suggest_data = import_utils.build_suggest_data_antibody_elisa_kit(result, relation_fields, "protein");

    relation_fields.forEach(name => delete result[name]);

    return {
        converted_item : result,
        suggest_data
    }
};

module.exports = {
    convert
};
