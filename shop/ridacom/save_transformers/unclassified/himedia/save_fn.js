let es_db        = require("../../../../../_utils/es_db.js");
let utils        = require("../../../../../_utils/utils.js");
let import_utils = require("../../../../_utils/save_utils.js");

let collection_name = "product";

let _load_original_products_data = async (items, mongo_db, export_version) =>
{
    let ids = items.reduce((res, item) => {
        res.push(item._id);
        if (item.sizes)
            item.sizes.forEach(size => res.push(size.product_id));
        return res
    }, []);

    let original_data = await mongo_db.read(collection_name, {body: {oid: {$in : ids}}});

    await mongo_db.update_many(collection_name, {query: {_id: {$in: original_data.map(item => item._id)}}, data: {export_version: export_version}});

    return original_data.reduce((res, item) =>
    {
        res[item.oid] = item;
        return res
    }, {});
};

let custom_save_to_db = async(export_version, convert, mongo_db, crawler_db, distributor, type, site, _save_suggest_data, bulk_result, update_fields_list) =>
{
    let limit = 500;
    let page = 0;
    let result = [];
    let count = await crawler_db.read(collection_name, {body: {type: type, src: site, tid: distributor, export_version: {$ne : export_version}}, count_only: true});

    do {
        let accumulated_suggest_data = {};
        let es_bulk                  = [];

        result = await crawler_db.read(collection_name, {body: {type: type, src: site, tid: distributor, export_version: {$ne : export_version}}, size: limit});

        let original_products_hash = await _load_original_products_data(result, mongo_db, export_version);

        result.forEach(item =>
        {
            let original_items = (item.sizes || []).map( size => original_products_hash[size.product_id]).filter(it => it);

            if (original_items.length)
            {
                let {converted_item, suggest_data} = convert(item, original_items);

                if (!converted_item){
                    return;
                }

                accumulated_suggest_data = import_utils.accumulate_suggest(accumulated_suggest_data, suggest_data);

                let _id = converted_item._id;
                delete converted_item._id;

                let document = {};

                if (update_fields_list)
                {
                    utils.objEach(update_fields_list, key => document[key] = converted_item[key])
                }
                else
                {
                    document = converted_item
                }

                es_bulk.push({"model_title": collection_name, "command_name": update_fields_list ? "update" : "index", "_id": _id, "document": document});
            }
        });

        await bulk_result(es_db, crawler_db, es_bulk);

        await _save_suggest_data(accumulated_suggest_data);

        let ids = result.map(({_id}) => _id);
        await crawler_db.update_many(collection_name, {query: {_id: {$in: ids}}, data: {export_version: export_version}});

        page++;
        console.log(distributor, type, site, `${page * limit}/${count}`)

    }
    while(result.length === limit)
};

module.exports = {
    custom_save_to_db
};