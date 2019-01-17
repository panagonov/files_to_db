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

    if(item.manual)
    {
        result.push({
            link: item.manual,
            ...item.pdf_preview ? {"thumb_link" : item.pdf_preview} : ""
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
        ...item.description             ? {"description" : item.description}                : "",
        ...item.host                    ? {"host" : item.host}                              : "", //todo
        ...item.reactivity              ? {"reactivity" : item.reactivity}                  : "", //todo
        ...item.application             ? {"application": item.application}                 : "", //todo
        ...item.isotype                 ? {"isotype": item.isotype}                         : "", //todo
        ...item.concentration           ? {"concentration" : item.concentration}            : "",
        ...clonality                    ? {"clonality": clonality}                          : "",
        ...item.clone_num               ? {"clone_id" : item.clone_num}                     : "",
        ...item.research_area           ? {"research_area": item.research_area}             : "",
        ...item.usage                   ? {"usage": item.usage}                             : "",
        ...item.shelf_life              ? {"shelf_life": item.shelf_life}                   : "",
        ...item.storage_conditions      ? {"storage_conditions": item.storage_conditions}   : "",
        ...item.delivery_conditions     ? {"delivery_conditions": item.delivery_conditions} : "",
        ...item.buffer_form             ? {"buffer_form": item.buffer_form}                 : "",
        ...item.immunogen               ? {"immunogen": item.immunogen}                     : "",
        ...images.length                ? {"images" : images}                               : "",
        ...pdf.length                   ? {"pdf" : pdf}                                     : "",
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