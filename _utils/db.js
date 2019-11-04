let MongoClient = require('mongodb').MongoClient;
let ObjectID    = require('mongodb').ObjectID;

let host = "localhost";
let port = 27017;

let Mongo = function()
{};

let S2OID = (sval) =>
{
    let result = null;

    if( typeof (sval) === "object" )
    {
        return sval;
    }

    try
    {
        if( sval )
            result = ObjectID.createFromHexString(sval);
    }
    catch( e )
    {
    }

    return result;
};

Mongo.prototype.init = async function(conf, counter = 0)
{
    if (this.db) return;
    try {
        let credentials = "";
        let search_string = "";
        if (conf.user)
        {
            credentials = `${conf.user}:${conf.pass}@`;
            search_string = "?authSource=admin";
        }

        let loginStr = `mongodb://${credentials}${conf.host || host}:${conf.port || port}/${conf.database}${search_string}`;

        let client = await MongoClient.connect(loginStr, {
            socketTimeoutMS  : conf.socketTimeoutMS || 120000,
            connectTimeoutMS : conf.connectTimeoutMS || 6000,
            reconnectTries   : conf.reconnectTries || 10,
            reconnectInterval: conf.reconnectInterval || 5000,
            useNewUrlParser  : true,
            useUnifiedTopology: true
        });
        this.db    = client.db(conf.database);
    }
    catch(e)
    {
        counter ++;
        console.log("Try to connect mongodb", counter);
        await new Promise((resolve, reject) => setTimeout(resolve, 5000));
        await this.init(conf, counter);
    }
};

Mongo.prototype.get_db = function()
{
    return this.db
};

Mongo.prototype.read_one = async function(model_title, params)
{
    if ( params.body._id ) {
        params.body._id = S2OID(params.body._id) || params.body._id;
    }

    if (params.sort)
    {
        return await this.db.collection(model_title).findOne(params.body, params.projection || {}).sort(params.sort)
    }
    return await this.db.collection(model_title).findOne(params.body, params.projection || {});
};


Mongo.prototype.read_by_id = async function(model_title, params)
{
    if ( params.id ) {
        params.id = S2OID(params.id) || params.id;
    }

    return await this.db.collection(model_title).findOne({_id: params.id}, params.projection || {});
};

/**
 *
 * @param {String} model_title
 * @param {Object} params
 * @param {Object} params.data
 * @param {Object} [params.options]
 * @returns {Promise<*>}
 */
Mongo.prototype.create_index = async function(model_title, params)
{
    try {
        return await this.db.collection(model_title).createIndex(params.data, params.options || {})
    }
    catch(e)
    {
        return;
    }
};

/**
 *
 * @param {String} model_title
 * @param {Object} params
 * @param {Object} params.body
 * @param {Number} [params.size]
 * @param {Number} [params.page]
 * @param {Object} [params.sort]
 * @param {Object} [params.projection]
 * @param {Boolean} [params.count_only]
 * @returns {Promise.<void>|Array|Number}
 */
Mongo.prototype.read = async function(model_title, params)
{
    params.size = params.size || 0;
    let skip = ((params.page || 1) - 1) * params.size;
    let result = [];
    if (params.count_only) {
        result = await this.db.collection(model_title).find(params.body).count();
    }
    else if (params.sort) {
        result = await this.db.collection(model_title).find(params.body, params.projection || {}).sort(params.sort).skip(skip).limit(params.size).toArray();
    }
    else {
        result = await this.db.collection(model_title).find(params.body, params.projection || {}).skip(skip).limit(params.size).toArray();
    }

    return result;
};

Mongo.prototype.create = async function(model_title, params)
{
    let result;
    let id = params.data._id;
    delete params.data._id;
    let is_empty_obj = !Object.keys(params.data).length;

    try {
        if (id && !is_empty_obj)
        {
            id = S2OID(id) || id;
            result = await this.db.collection(model_title).updateOne({_id : id}, {$set :params.data}, {upsert: true});
            result = result.result.upserted ? result.result.upserted[0] : {_id : id}
        }
        else if (id && is_empty_obj)
        {
            id = S2OID(id) || id;
            result = await this.db.collection(model_title).insertOne({_id : id});
            result = result.ops[0]
        }
        else
        {
            result = await this.db.collection(model_title).insertOne(params.data);
            result = result.ops[0]
        }
    }
    catch(e)
    {
        console.error(e);
        return false;
    }

    return result;
};

Mongo.prototype.create_many = async function(model_title, params)
{

    return await this.db.collection(model_title).insertMany(params.data);
};

/**
 *
 * @param {String} model_title
 * @param {Object} params
 * @param {Object} params.body
 * @returns {Promise.<void>}
 */
Mongo.prototype.remove_by_query = async function(model_title, params)
{
    await this.db.collection(model_title).deleteMany(params.body, {justOne: false})
};

/**
 *
 * @param {String} model_title
 * @param {Object} params
 * @param {String} params.id
 * @returns {Promise.<void>}
 */
Mongo.prototype.remove = async function(model_title, params)
{
    let id = S2OID(params.id) || params.id;
    await this.db.collection(model_title).deleteOne({_id: id})
};

/**
 *
 * @param {String} model_title
 * @param {Object} params
 * @param {Object} params.data
 * @param {String} params.data._id
 * @param {Object} [params.unset]
 * @param {Object} [params.options]
 * @returns {Promise.<void>}
 */
Mongo.prototype.update = async function(model_title, params) {
    let id = S2OID(params.data._id) || params.data._id;
    delete params.data._id;

    let update_query = {};
    params.data ? update_query["$set"] = params.data : null;
    params.unset ? update_query["$unset"] = params.unset : null;

    await this.db.collection(model_title).updateOne({_id: id}, update_query, params.options || {})
};

/**
 *
 * @param {String} model_title
 * @param {Object} params
 * @param {Object} params.query
 * @param {Object} [params.data]
 * @param {Object} [params.unset]
 * @returns {Promise.<void>}
 */
Mongo.prototype.update_many = async function(model_title, params) {
    if ( !params.query ) {
        throw new Error('use only with query');
    }

    params.data ? delete params.data._id : null;

    let update_query = {};
    params.data ? update_query["$set"] = params.data : null;
    params.unset ? update_query["$unset"] = params.unset : null;

    await this.db.collection(model_title).updateMany(params.query, update_query)
};

/**
 *
 * @param {String} model_title
 * @param {Object} params
 * @param {String} [params.unwind]
 * @param {Object} params.match
 * @param {Object} params.group
 * @param {Object} [params.sort]
 * @param {String} [params.out]
 * @param {Object} [params.options]
 * @returns {Promise.<void>}
 */
Mongo.prototype.aggregate = async function(model_title, params) {

    let query = [{$match: params.match}, {$group: params.group}];
    if (params.unwind)
    {
        query.unshift({$unwind: "$" + params.unwind})
    }
    if (params.out)
    {
        query.push({$out: params.out})
    }
    if (params.sort)
    {
        return this.db.collection(model_title).aggregate(query, params.options || {}).sort(params.sort).toArray()
    }
    return await this.db.collection(model_title).aggregate(query, params.options || {}).toArray()
};

/**
 *
 * @param model_title
 * @param {Array} data
 * @param {String} data.command_name - "update"|"upsert"
 * @param {String} data._id
 * @param {Object} data.document
 * @returns {Promise<void>}
 */
Mongo.prototype.bulk = async function(model_title, data)
{
    let bulk = this.db.collection(model_title).initializeUnorderedBulkOp();

    data.forEach(bulk_data =>
    {
        let document = bulk_data.document;
        switch(bulk_data.command_name)
        {
            case "update" :
                document = {$set : document};
                bulk.find( { _id: bulk_data._id } )[bulk_data.command_name]( document );
                break;
            case "upsert":
                bulk.find( { _id: bulk_data._id } ).upsert().updateOne(document);
                break;
            case "index":
                bulk.find( { _id: bulk_data._id } ).upsert().replaceOne(document);
                break;
            default:
                bulk.find( { _id: bulk_data._id } )[bulk_data.command_name]( document );
        }
    });

    await bulk.execute();
};
/**
 *
 * @param model_title
 * @returns {Promise<void>}
 */
Mongo.prototype.drop = async function(model_title)
{
    try {
        await this.db.collection(model_title).drop();
    }
    catch(e) {}
};

Mongo.prototype.compact = async function()
{
    let collections = await this.db.listCollections().toArray();

    for (let j = 0; j < collections.length; j++)
    {
        let collectionName = collections[j].name;
        console.log(`Compacting: ${collectionName}`);
        await this.db.command({compact: collectionName});
    }
};


module.exports = Mongo;