let util               = require('util');
let elasticsearch      = require('elasticsearch');
let schema_validator   = require('./schema_validator.js');
let consts             = require('./consts.js');
let directory_reader   = require('../directory_reader.js');

let config = {
    "host"             : "172.16.1.15",
    "port"             : "9200",
    "requestTimeout"   : "600000",
    "tryToConnect"     : 10,
    "delayBetweenRetry": 5000
};

let es = new elasticsearch.Client({
    host: [config.host, config.port].join(":"),
    requestTimeout: config.requestTimeout
     // ,log: 'trace'
});
let files = directory_reader(__dirname + '/models/', 'js');
let models = {};
let initialized = false;

let connectToDb = async (counter = 0) =>
{
    let db;
    if (counter >= config.tryToConnect)
    {
        return process.exit(1)
    }
    try
    {
        await verifyPhysicalStructure();
    }
    catch(e)
    {
        counter ++;
        console.log("Try to connect elasticsearch", counter);
        console.log(e);
        await new Promise((resolve, reject) => setTimeout(resolve, config.delayBetweenRetry));
        db = await connectToDb(counter);
    }
    return db;
};

let init = async () => {
    if (initialized)
        return;
    initialized = true;
    models = schema_validator.loadModels(files);
    await connectToDb();
};


let verifyPhysicalStructure = async () => {

    for (let file in files) {
        let physical = files[file];
        if (physical) {
            await verifyPhysicalModel(physical);
        }
        else {
            console.error('physical model ' + file + ' won\'t be created for model');
        }
    }
};

let createIndices = async (settings) => {
    await(es.indices.create({
        "index": settings.index + "_v1",
        "body": settings.mapping
    }));
};

let createType = async (settings) => {
    await(es.indices.putMapping({
        "index" : settings.index,
        "type" : settings.doc_type,
        "body" : settings.mapping.mappings
    }));
};

let initialImport = async (config) => {
    if ( config.import_initial_data ) {
        let import_config = config.import_initial_data;
        let title = import_config.title;

        for(let i=0; i< import_config.items.length; i++ ) {
            let item = import_config.items[i];

            await upsert(title, {data:item});
        }
    }
};

let verifyPhysicalModel = async (physical) => {
    if ( !physical.settings ) {
        return;
    }

    let settings = physical.settings;
    let isIndexes = await es.indices.exists({index: settings.index});
    if (!isIndexes) {

        await createIndices(settings);
        await initialImport(physical);
    }
    else if ( !await(es.indices.existsType({index: settings.index, type : settings.doc_type} ) ) ) {
        await createType(settings);
        await initialImport(physical);
    }
};

let getIndexAndType = (model_title) =>
{
    let index;
    let type;
    if (model_title instanceof Array)
    {
        index = model_title.map(title => models[title].settings.index);
        // if (index.some(ind => ind !== index[0]))
        // {
        //     console.error("Types with different indexes!!!", model_title, index)
        // }
        index = index.join(",");
        type = model_title.map(title => models[title].settings.doc_type).join(",");
    }
    else if ( model_title && models[model_title])
    {
        type = models[model_title].settings.doc_type;
        index = models[model_title].settings.index;
    }
    else {
        index = 'genetics*';
    }
    return [index, type]
};
/***
 *
 * @param all - boolean if true, returns index and type
 * @returns {Array}
 */
let get_user_indexes = (all) =>
{
    let indexes = [];
    let indexes_all = [];
    for (let key in models) {
        if (models.hasOwnProperty(key) && models[key].settings && models[key].settings.user_data) {
            indexes.push (models[key].settings.index);
            indexes_all.push({index : models[key].settings.index, doc_type : models[key].settings.doc_type});
        }
    }
    if (all) {
        return indexes_all;
    }
    return indexes;
};

let _add_node_type = (node, add_type, type) =>
{
    if (add_type)
        node._type = add_type === true ? type : add_type;

    return node;
};

let create = async (model_title, params) => {

    schema_validator.validate_strict(models, model_title, params.data);

    let id = params.data._id;
    delete params.data._id;

    let doc = params.data;

    let create_config = {
        index: models[model_title].settings.index,
        type: models[model_title].settings.doc_type,
        refresh: true,
        body:  doc
    };

    try {
        let result;
        if ( id ) {
            create_config.id = id;
        }
        result = await es.index(create_config);

        return result._id;

    }
    catch (e) {
        console.error(e);
        return false;
    }
};

let update_raw = async (model_title, params) => {
    let config = params;
    config.index = models[model_title].settings.index;
    config.type = models[model_title].settings.doc_type;
    config.refresh = true;

    return await es.update(config);
};

let update = async (model_title, params) => {
    schema_validator.validate(models, model_title, params.data);

    // if not cloned , it will change the input param
    let update_data = JSON.parse(JSON.stringify(params.data));

    let id = params.data._id;
    delete update_data._id;

    let body = {};
    if (params.script)
    {
        body.script =  params.script
    }
    else
    {
        body.doc = update_data
    }

    let update_config = {
        index: models[model_title].settings.index,
        type: models[model_title].settings.doc_type,
        refresh: true,
        id: id,
        body: body
    };

    try {
        await es.update(update_config);
    }
    catch (e) {
        // console.error(e);
        return false;
    }

    return true;
};

let upsert = async (model_title, params) => {

    let upsert_params = {
        index: models[model_title].settings.index,
        type: models[model_title].settings.doc_type,
        refresh: true
    };

    if (params.data._id) {
        schema_validator.validate(models, model_title, params.data);
        upsert_params.id = params.data._id;
        delete params.data._id;
    }

    upsert_params.body = params.data;

    let upserted = await es.index(upsert_params);

    params.data._id = upserted._id;

    return params.data;
};

let remove = async (model_title, params) => {
    let [index, type] = getIndexAndType(model_title);

    try {
        await es.delete({
            index: index,
            type: type,
            refresh: true,
            id: params.id
        });
    }
    catch (e) {
        return false;
    }

    return true;
};

let remove_by_query = async (model_title, params) => {

    let [index, type] = getIndexAndType(model_title);

    try {
        await es.deleteByQuery({
            index: index,
            type: type,
            refresh: true,
            body: params.body
        });
    }
    catch (e) {
        return false;
    }

    return true;
};

let remove_by_query_internal = async (index, params) => {
    try {
        let delete_batch = {
            index: index,
            refresh: true,
            body: params.body
        };

        if ( params.type ) {
            delete_batch[type] = params.type;
        }


        await es.deleteByQuery(delete_batch);
    }
    catch (e) {
        return false;
    }

    return true;
};

/**
 *
 * @param {String|Array} model_title
 * @param {Object} params
 * @param {Object} params.body
 * @param {Number} [params.page]
 * @param {Number} [params.size]
 * @param {Boolean} [params.add_type]
 * @param {Boolean} [params.count_only]
 * @returns {Promise.<{}>}
 */
let read = async (model_title, params) => {
    if (params.size > consts.PAGE.MAX_SIZE) {
        console.error('ES DB: request for maximum documents has been detected', params.size, consts.PAGE.MAX_SIZE);
    }

    params.size = params.size || params.size === 0 ? params.size : consts.PAGE.DEFAULT_SIZE;
    params.size = Math.min(params.size, consts.PAGE.MAX_SIZE);

    let [index, type] = getIndexAndType(model_title);

    try {
        return await read_internal(index, type, params);
    }
    catch(e)
    {
        console.error(e)
    }
};

let read_unlimited = async (model_title, params) => {
    // DON'T EXPOSE THIS METHOD UNDER ANY CIRCUMSTANCES
    params.size = params.size || params.size === 0 ? params.size : consts.PAGE.DEFAULT_SIZE;
    let [index, type] = getIndexAndType(model_title);

    try {
        return await read_internal(index, type, params);
    }
    catch(e)
    {
        console.error(e)
    }
};

/**
 *
 * @param {String|Array} model_title
 * @param {Object} params
 * @param {Object} params.body
 * @param {Integer} [params.chunk]
 * @param {Boolean} [params.add_type]
 * @returns {Promise.<*>}
 */
let read_all = async (model_title, params) => {

    let [index, type] = getIndexAndType(model_title);
    let data = [];
    let page;

    try {
        page = await es.search({
            index: index,
            type: type,
            "size": params.chunk || 5000,
            "scroll": '2m',
            "from": 0,
            "body": params.body
        });

        data = page.hits.hits;

        let sid = page._scroll_id;
        let scroll_size = page.hits.hits.length;

        while (scroll_size > 0) {
            page = await(es.scroll({
                scroll_id: sid,
                scroll: '2m'
            }));
            sid = page._scroll_id;
            scroll_size = page.hits.hits.length;
            data = data.concat(page.hits.hits)
        }
    }
    catch(e)
    {
        console.error(e)
    }

    let result = {};
    result.count = page.hits.total;
    result.data = (data || []).map((item) => {
        let new_item = {};
        new_item._id = item._id;
        item.highlight ? new_item.highlight = item.highlight : null;
        new_item = _add_node_type(new_item, params.add_type, item._type);

        return Object.assign(new_item, item._source);
    });
    result.aggregations = page.aggregations;

    return result;

};
/**
 *
 * @param {String} index
 * @param {String|null} doc_type
 * @param {Object} params
 * @param {Number} [params.size]
 * @param {Number} [params.page]
 * @param {Object} params.body
 * @param {Boolean} [params.add_type]
 * @param {Boolean} [params.count_only]
 * @param {String} [params._scroll_id]
 * @returns {Promise.<{}>}
 */
let read_internal = async (index, doc_type, params) => {
    if (!params.body)
    {
        return {count: 0, data: []}
    }

    let size = params.size || params.size === 0 ? params.size : consts.PAGE.DEFAULT_SIZE;
    let from = ((params.page || 1) - 1) * (size || 10);
    let search_config = {
        "index": index,
        "size" : size,
        "body" : params.body,
    };

    if (from)
    {
        search_config.from = from;
    }
    else if(size)
    {
        search_config.scroll = "2m"
    }

    if (doc_type) {
        search_config.type = doc_type;
    }
    if (params.count_only)
    {
        delete search_config.size;
        delete search_config.from;
        delete search_config.scroll;
        delete search_config.body.aggs;
        delete search_config.body.sort;
        delete search_config.body.highlight;
        delete search_config.body._source;
        delete search_config.body.stored_fields;
        return await es.count(search_config);
    }

    let hits;
    if (params._scroll_id)
    {
        hits = await(es.scroll({
            scroll_id: params._scroll_id,
            scroll: '2m'
        }))
    }
    else
    {
        hits = await es.search(search_config);
    }

    let result = {};
    result.count = hits.hits.total;
    result.data = (hits.hits.hits || []).map((item) => {
        let new_item = {};
        new_item._id = item._id;
        item.highlight ? new_item.highlight = item.highlight : null;
        new_item = _add_node_type(new_item, params.add_type, item._type);

        return Object.assign(new_item, item._source);
    });
    result.aggregations = hits.aggregations;
    result._scroll_id = hits._scroll_id;

    return result;
};

let read_by_id_raw = async (model_title, params) => {
    let read_config = params;
    let [index, type] = getIndexAndType(model_title);
    read_config.index = index;
    read_config.type = type;

    return await es.get(read_config);
};

let read_by_id = async (model_title, params) => {
    try {
        let [index, type] = getIndexAndType(model_title);
        let hits = await es.get({
            index: index,
            type: type,
            id: params.id
        });

        if (hits.found) {
            let item = hits._source;

            let new_item = {};
            new_item._id = hits._id;
            item = _add_node_type(item, params.add_type, hits._type);

            return Object.assign(new_item, item);
        }

        return null;
    }
    catch (e) {
        // console.log(789232, e, model_title, params);
        return null;
    }
};

let read_one = async (model_title, params) => {

    let [index, type] = getIndexAndType(model_title);
    let hits = {};
    try {
        hits = await es.search({
            index:index,
            type: type,
            "body": params.body
        });
    }
    catch(e)
    {
        console.error(e)
    }
    if (hits.hits.total > 0) {
        if (hits.hits.total > 1) {
            console.error(283756443342, util.format("read_one found more than 1 document and retrieved only the first one. documents total: %s", hits.hits.total));
        }

        let item = hits.hits.hits[0];

        let new_item = {};
        new_item._id = item._id;
        new_item = _add_node_type(new_item, params.add_type, item._type);

        try {
            let result =  Object.assign(new_item, item._source);
            return result;
        }
        catch(e) {
            console.log(7689423, e);
            return null;
        }
    }

    // console.error(1328232, "item can not be found");
    return null;
};

let get_meta_ui = async() => {
    let result = {};
    for (let key in models) {
        if (models.hasOwnProperty(key) && models[key].meta_ui) {
            result[key] = models[key].meta_ui
        }
    }
    return result;
};

let bulk = async (data) => {
    let bulk = [];
    data = data || [];
    if ( data.length < 1 ) {
        console.error('bulk batch is empty');
        return;
    }

    for (let i=0; i < data.length; i++ ) {
        let command = {};

        try {
            schema_validator.validate(models, data[i].model_title, data[i].document);
        }
        catch (e) {
            console.error(e);
            continue;
        }

        command[data[i].command_name] = {
            _index: models[data[i].model_title].settings.index,
            _type: models[data[i].model_title].settings.doc_type,
        };
        if ( data[i]._id ) {
            command[data[i].command_name]._id = data[i]._id;
        }
        bulk.push(command);

        if ( data[i].command_name === 'update' ) {
            if ( data[i].document) {
                bulk.push({ doc : data[i].document});
            }
            else if( data[i].script) {
                bulk.push({ script : data[i].script});
            }
        }
        else if ( data[i].command_name === 'index' || data[i].command_name === 'create' ) {
            if ( data[i].document) {
                bulk.push(data[i].document);
            }
        }
    }


    try {
        await es.bulk({
            refresh: true,
            body : bulk
        });
    }
    catch(e) {
        console.error(13213653, e);
    }
};


/**
 *
 * @param {String} model_title
 * @param {Object} params
 * @param {Object} params.body
 * @param {Number} params.limit
 * @param {String} params.sid
 * @returns {Promise.<*>}
 */
let read_internal_scroll = async (model_title, params) => {

    let [index, type] = getIndexAndType(model_title);

    let data = [];
    let page;
    let sid;

    try {
        if (params.sid)
        {
            page = await(es.scroll({
                scroll_id: params.sid,
                scroll: '3600m'
            }));
            sid = page._scroll_id;
            data = data.concat(page.hits.hits)
        }
        else
        {
            page = await es.search({
                index: index,
                type: type,
                "size": params.size,
                "scroll": '3600m',
                "from": 0,
                "body": params.body
            });

            data = page.hits.hits;
            sid = page._scroll_id;
        }
    }
    catch(e)
    {
        console.error(e)
    }

    let result = {};
    result.count = page.hits.hits.length;
    result.data = (data || []).map((item) => {
        let new_item = {};
        new_item._id = item._id;
        return Object.assign(new_item, item._source);
    });
    result.sid = sid;
    result.aggregations = page.aggregations;

    return result;
};

module.exports = {
    getDb                       : () => es,
    init                        : init,
    create                      : create,
    read                        : read,
    read_unlimited              : read_unlimited,
    read_by_id                  : read_by_id,
    read_by_id_raw              : read_by_id_raw,
    read_one                    : read_one,
    read_all                    : read_all,
    read_internal               : read_internal,
    read_internal_scroll        : read_internal_scroll,
    update                      : update,
    update_raw                  : update_raw,
    upsert                      : upsert,
    remove                      : remove,
    remove_by_query             : remove_by_query,
    get_meta_ui                 : get_meta_ui,
    bulk                        : bulk,
    get_user_indexes            : get_user_indexes,
    remove_by_query_internal    : remove_by_query_internal,
    getIndexAndType             : getIndexAndType
};