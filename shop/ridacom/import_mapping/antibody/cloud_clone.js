let semantica = require("../../../../common-components/search-engine-3/domains/genetics/index.js");
let utils     = require("../../../../_utils/utils.js");


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
            atom.push(synonyms.map(({name}) => name).join(" "));
        return atom
    });
    return atoms
};

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

    return result
};

let _getPdf = item =>
{
    let result = [];

    if(item.pdf)
    {
        result.push({
            link: item.pdf.link,
            ...item.pdf.preview ? {"thumb_link" : item.pdf.preview} : ""
        })
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

    (crawler_item.price || []).forEach((price, index )=> {
        result.variation.push({
            "price" : {
                "value" : price || 0,
                "currency": "usd",
                "size" : crawler_item.size[index]
            }
        })
    });

    return result;
};

let mapping_step1 = {
    "name"               : record => record.name,
    "supplier"           : record => ({
            "name": "Cloud-Clone Corp.",
            "_id" : "cloud_clone_corp"
        }
    ),
    "distributor"    : record => ({
            "name": "RIDACOM Ltd.",
            "_id" : "ridacom_ltd"
        }
    ),
    "oid"                : "oid",
    "human_readable_id"  : record => record.name.replace(/\W/g, "_").replace(/\s/g, "_").replace(/_+/, "_").replace(/^_/, "").replace(/_$/, "") + "_" + record.oid,
    "external_links"     : record => [{"key": "cloud_clone", "id": record.oid}],
    "bio_object"         : record => ({
        "type": "protein",
        ...record.item_name ? {"name": record.item_name} : "",
        ...record.aliases ? {"aliases": record.aliases} : ""
    }),
    "price_model"        : record => _getPriceModel(record, record.crawler_item),
    "description"        : "description",
    "host"               : record => get_canonical(record.host || "", [":host", ":reactivity"]),
    "reactivity"         : record => get_canonical(record.reactivity.join("; "), [":host", ":reactivity"]),
    "application"        : record => get_canonical(record.application.join("; "), ":application"),
    "isotype"            : record => get_canonical(record.isotype || "", ":isotype"),
    "light_chain"        : record => get_canonical(record.isotype || "", ":light_chain"),
    "heavy_chain"        : record => get_canonical(record.isotype || "", ":heavy_chain"),
    "clonality"          : record => get_canonical(record.source || "", ":clonality"),
    "concentration"      : "concentration",
    "clone_id"           : "clone_num",
    "research_area"      : record => get_canonical(record.research_area.join("; ") || "", ":research_area"),
    "usage"              : "usage",
    "shelf_life"         : "shelf_life",
    "storage_conditions" : "storage_conditions",
    "delivery_conditions": "delivery_conditions",
    "buffer_form"        : "buffer_form",
    "immunogen"          : "immunogen",
    "images"             : record =>  _getImages(record.crawler_item),
    "pdf"                : record =>  _getPdf(record.crawler_item),
    "supplier_specific"  : record => ({
        "price" : record.supplier_specific.price,
        "link"  : record.link
    })
};

let mapping_step2 = {
    "host_relations"          : record => record.host && record.host.length? record.host.map(([,key]) => key) : null,
    "reactivity_relations"    : record => record.reactivity && record.reactivity.length? record.reactivity.map(([,key]) => key) : null,
    "application_relations"   : record => record.application && record.application.length? record.application.map(([,key]) => key) : null,
    "isotype_relations"       : record => record.isotype && record.isotype.length? record.isotype.map(([,key]) => key) : null,
    "light_chain_relations"   : record => record.light_chain && record.light_chain.length ? record.light_chain.map(([,key]) => key) : null,
    "heavy_chain_relations"   : record => record.heavy_chain && record.heavy_chain.length ? record.heavy_chain.map(([,key]) => key) : null,
    "clonality_relations"     : record => record.clonality && record.clonality.length ? record.clonality.map(([,key]) => key) : null,
    "research_area_relations" : record => record.research_area && record.research_area.length ? record.research_area.map(([,key]) => key) : null,
    "supplier_relations"      : record => ["Cloud-Clone Corp."],
    "distributor_relations"   : record => ["RIDACOM Ltd."],
    "ui"                      : record => {
        let result = {
            "host"               : record.host && record.host.length? record.host.map(([,,name]) => name) : null,
            "reactivity"         : record.reactivity && record.reactivity.length? record.reactivity.map(([,,name]) => name) : null,
            "application"        : record.application && record.application.length? record.application.map(([,,name]) => name) : null,
            "isotype"            : record.isotype && record.isotype.length? record.isotype.map(([,,name]) => name) : null,
            "light_chain"        : record.light_chain && record.light_chain.length? record.light_chain.map(([,,name]) => name) : null,
            "heavy_chain"        : record.heavy_chain && record.heavy_chain.length? record.heavy_chain.map(([,,name]) => name) : null,
            "clonality"          : record.clonality && record.clonality.length ? record.clonality.map(([,,name]) => name) : null,
            "supplier"           : ["cloud_clone_corp"],
            "distributor"        : ["ridacom_ltd"]
        };

        for (let key in result)
            if (!result[key])
                delete result[key];

        return result;
    },
    "synonyms"                 : record => {
        let result = {
            "host"               : record.host && record.host.length? record.host.map(([,,,,name]) => name).filter(name => name) : null,
            "reactivity"         : record.reactivity && record.reactivity.length? record.reactivity.map(([,,,,name]) => name).filter(name => name) : null,
            "application"        : record.application && record.application.length? record.application.map(([,,,,name]) => name).filter(name => name) : null,
            "isotype"            : record.isotype && record.isotype.length? record.isotype.map(([,,,,name]) => name).filter(name => name) : null,
            "light_chain"        : record.light_chain && record.light_chain.length? record.light_chain.map(([,,,,name]) => name).filter(name => name) : null,
            "heavy_chain"        : record.heavy_chain && record.heavy_chain.length? record.heavy_chain.map(([,,,,name]) => name).filter(name => name) : null,
            "clonality"          : record.clonality && record.clonality.length? record.clonality.map(([,,,,name]) => name).filter(name => name) : null,
            "research_area"      : record.research_area && record.research_area.length? record.research_area.map(([,,,,name]) => name).filter(name => name) : null,
        };

        for (let key in result)
            if (!result[key])
                delete result[key];

        return result;
    },
};

let mapping_step3 = {
    "search_data": record =>
    {
        let res = [].concat(
            [record.name],
            record.bio_object.aliases || [],
            record.ui.host || [],
            record.ui.reactivity || [],
            record.ui.application || [],
            record.ui.isotype || [],
            record.ui.light_chain || [],
            record.ui.heavy_chain || [],
            record.ui.clonality || [],
            record.synonyms.host || [],
            record.synonyms.reactivity || [],
            record.synonyms.application || [],
            record.synonyms.isotype || [],
            record.synonyms.light_chain || [],
            record.synonyms.heavy_chain || [],
            record.synonyms.clonality || [],
        );
        return res.join(" ").replace(/\(|\)|,/g, " ").replace(/\s+/g, " ").trim()
    }
};

let convert = (item, crawler_item) =>
{
    let record = Object.assign({}, item, {crawler_item: crawler_item});
    let result_step1 = utils.mapping_transform(mapping_step1, record);
    let result_step2 = utils.mapping_transform(mapping_step2, result_step1);
    let result_step3 = utils.mapping_transform(mapping_step3, Object.assign(result_step1, result_step2));
    let result = Object.assign(result_step1, result_step2, result_step3);

    delete result.synonyms;
    delete result.host;
    delete result.reactivity;
    delete result.application;
    delete result.isotype;
    delete result.light_chain;
    delete result.heavy_chain;
    delete result.clonality;
    delete result.research_area;

    return result
};



module.exports = {
    convert
};

let test = (text) =>
{
    let db = semantica.getDb();
    let res = semantica.analyseSpeech("eng", text);
    // let parents = semantica.knowledge.getTagParents(db, res[0][1]);
    console.log(res)
    debugger
};

// console.log(test("Loading Control of WB" ))

// console.log(get_canonical("Rat CHO Guinea pig E.coli 293F Mouse Rabbit n/a null", [":host", ":reactivity"]));
