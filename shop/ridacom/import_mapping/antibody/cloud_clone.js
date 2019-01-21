let semantica = require("../../../../common-components/search-engine-3/domains/genetics/index.js")

let _getClonality = str =>
{
    if (str.toLowerCase().indexOf("monoclonal") !== -1)
        return "monoclonal";
    else if (str.toLowerCase().indexOf("polyclonal") !== -1)
        return "polyclonal";
    return null;
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
                "value" : price,
                "currency": "usd",
                "size" : crawler_item.size[index]
            }
        })
    });

    return result;
};

let get_canonical = (text, type) =>
{
    if (typeof type === "string")
        type = [type];

    let atoms = semantica.analyseSpeech("eng", text);
    atoms = atoms.filter(([atom_type]) => type.indexOf(atom_type) !== -1);
    let keys = atoms.map(([,id]) => id);
    let ui = atoms.map(([,,name]) => name);
    console.log(atoms, text, type);
    return [keys, ui]
}


let convert = (item, crawler_item) =>
{
    let clonality = _getClonality(item.source);
    let images = _getImages(crawler_item);
    let pdf = _getPdf(crawler_item);
    let price_model = _getPriceModel(item, crawler_item);


    let result = {
        "name" : item.name,
        "supplier" : {
            "name" : "RIDACOM Ltd."
        },
        "external_links" : [
            {"key": "cloud_clone", "id" : item.oid}
        ],
        "bio_object" : {
            "type" : "protein",
            ...item.item_name ? {"name" : item.item_name} : "",
            ...item.aliases   ? {"aliases" : item.aliases} : "",

        },
        "price_model"                   : price_model,
        ...item.description             ? {"description" : item.description}                                                    : "",
        ...item.host                    ? {"host" : get_canonical(item.host, [":host", ":reactivity"])}                         : "", //todo
        ...item.reactivity              ? {"reactivity" : get_canonical(item.reactivity.join("; "), [":host", ":reactivity"])}  : "", //todo
        ...item.application             ? {"application": get_canonical(item.application.join("; "), ":application")}           : "", //todo
        ...item.isotype                 ? {"isotype": get_canonical(item.isotype, ":isotype")}                                  : "", //todo
        ...clonality                    ? {"clonality": get_canonical(clonality, ":clonality")}                                 : "",
        ...item.concentration           ? {"concentration" : item.concentration}                                                : "",
        ...item.clone_num               ? {"clone_id" : item.clone_num}                                                         : "",
        ...item.research_area           ? {"research_area": item.research_area}                                                 : "",
        ...item.usage                   ? {"usage": item.usage}                                                                 : "",
        ...item.shelf_life              ? {"shelf_life": item.shelf_life}                                                       : "",
        ...item.storage_conditions      ? {"storage_conditions": item.storage_conditions}                                       : "",
        ...item.delivery_conditions     ? {"delivery_conditions": item.delivery_conditions}                                     : "",
        ...item.buffer_form             ? {"buffer_form": item.buffer_form}                                                     : "",
        ...item.immunogen               ? {"immunogen": item.immunogen}                                                         : "",
        ...images.length                ? {"images" : images}                                                                   : "",
        ...pdf.length                   ? {"pdf" : pdf}                                                                         : "",
        "supplier_specific" : {
            "price" : item.supplier_specific.price,
            "link"  : item.link
        }
    };

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

// test("Rat CHO Guinea pig E.coli 293F Mouse Rabbit n/a null", )

// console.log(get_canonical("Rat CHO Guinea pig E.coli 293F Mouse Rabbit n/a null", [":host", ":reactivity"]));
