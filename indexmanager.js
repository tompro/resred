var commandBuilder = require("./commandbuilder");

var validIndexes = {
	"unique": [],
	"index": [],
	"sorted": ["number"]
};

var schemaDescriptionKey = "schema_description";

var IndexManager = module.exports = function(options) {
	
	this.options = options || {};
	this.hasIndexes = false;
	this.indexMap = {};
	this.connection = this.options.connection;

	this.setupKeyOptions(this.options.keyOptions);
	
	if(this.options.schema) {
		this.setupSchema(options.schema);
		this.updateIndexes();
	}
}

IndexManager.prototype.processDocValues = function(key, doc, cb) {

	client.hget(key.ns, key.id, function(err, data){
		// now for all doc props with index check if changed
	});

}

IndexManager.prototype.runUpdateTransaction = function(key, doc, cb) {
	// key{ns:ns, id:id}
	
	for (name in doc) {
		
	}

	/*
	self.connection.hset(id["ns"], id["id"], JSON.stringify(val), function(err, res) {
		if(err) {
			return cb({status: 500});
		}
		self.get(key, cb);
	});
	 */

}

IndexManager.prototype.runCreateTransaction = function(key, doc, cb) {
	var self = this, indexes = {}, multi = connection.multi();
	for(name in doc) {
		if(self.indexMap[name]) {
			for(index in self.indexMap[name]) {
				self.appendIndexCommand(multi);
			}
		}
	}
}

IndexManager.prototype.appendIndexCreateCommand = function(multi, indexName, propName, propValue) {



	//redis.hget("prefix/ns/prop1/unique", "asdf");
	//redis.hsetnx("prefix/ns/propName/unique", propValue, docid);
}

IndexManager.prototype.updateIndexes = function() {
	var self = this;

	// TODO: We may also have to drop existing indexes in this case.
	// Not implementing for now as Resred can be used without any indexes.
	if(!self.hasIndexes) return; 

	// at least now we have to have a redis connection
	if(!this.connection) {
		throw new Error("Redis connection needed for IndexManager");
	}

	// get existing schema def from redis
	// prefix/schema_description[ns]
	//this.connection.hget(this.prefix + schemaDescriptionKey, )


	// compare string representation of indexMap with schema
	// 
	// if unchanged -> OK
	// if changed but not affecting existing indexes -> OK and update redis schema
	// 
	// if changed and affecting existing schema -> either automigrate or throw error
	// with informative message
}

/**
 * Sets up the redis key options if provided. Otherwise sets defaults.
 * 
 * @param  {Object} options
 */
IndexManager.prototype.setupKeyOptions = function(options) {
	options = options || {};
	this.prefix = (options.prefix ? (options.prefix + "/") : "");
	this.ns = options.ns || "default";
	this.key = this.prefix + this.ns + "/";
}

/**
 * Sets up the index managers internal schema based on provided 
 * resourceful schema and redis properties.
 * 
 * @param  {Object} schema A resourceful schema with optional redis properties
 */
IndexManager.prototype.setupSchema = function(schema) {
	var self = this, name, prop, properties = schema.properties;
	if(!properties) return;
	
	for (name in properties) {
		prop = properties[name];
		if(prop.redis && typeof prop.redis === "string") {
			prop.redis = [prop.redis]
		}
		if(self.validateProperty(prop) ) {
			self.hasIndexes = true;
			self.addIndexedProperty(name, prop);
		}
	}
}

/**
 * Adds given indexes for given properties to this managers schema
 * 
 * @param {String} name     Property name
 * @param {Object} property Property description
 */
IndexManager.prototype.addIndexedProperty = function(name, property) {
	var self = this, mapEntry, i, index;
	if(!self.indexMap[name]) self.indexMap[name] = {};
	mapEntry = self.indexMap[name];

	for(i=0; i<property.redis.length; i++) {
		index = property.redis[i];
		if(typeof index === "string") {
			mapEntry[index] = {};
		} else {
			mapEntry[index.name] = {
				convert: index.convert
			}
		}
	}
}

/**
 * Looks up and validates redis indexes in a given sheme object. Returns true 
 * if a scheme has redis properties that are valid.
 *  
 * @param  {Object} property A resourceful scheme property object
 * @return {boolean}
 */
IndexManager.prototype.validateProperty = function(property) {
	var self = this, redisProps = property.redis, prop, indexName, i;
	if(!property.redis) return false;

	for(i=0; i < redisProps.length; i++) {
		prop = redisProps[i];
		indexName = prop.name || prop;
		if(!self.allowedIndexType(indexName, property.type, prop.convert)) {
			return false;
		}
	}

	return true;
}

/**
 * Validates against allowed redis index types registered for given resourceful types. 
 * Returns true if given index type exists an is valid for given resourceful type. If given 
 * index type is valid and an optional convert function is provide the index type combination 
 * is also valid.
 * 
 * @param  {String} indexName Name of the redis index type
 * @param  {String} propType  Type of the resourceful property
 * @param  {[Function]} convert An optional conversion function
 * @return {boolean}
 */
IndexManager.prototype.allowedIndexType = function(indexName, propType, convert) {
	if(!validIndexes[indexName]) return false;
	if(typeof convert === "function") return true;

	if(validIndexes[indexName].length > 0) {
		if(validIndexes[indexName].indexOf(propType) === -1) return false;
	}

	return true;
}

var sampleDocuments = [
	{
		"id": "id1",
		"prop1": "asdf",
		"prop2": "asdf",
		"prop3": 1
	},
	{
		"id": "id2",
		"prop1": "qwer",
		"prop2": "qwer",
		"prop3": 3
	},
	{
		"id": "id3",
		"prop1": "tzui",
		"prop2": "tzui",
		"prop3": 2
	}
]

var sampleIndexDefinition = {
	"prop1": ["unique"], // works for all types
	"prop2": ["index"], // works for all types
	"prop3": ["sort"] // works for number types or if a converter function is provided we can apply conversion
}

// updateIndex(ns, id, indexName, propName, value) {
// 	
// 
// }


// UNIQUE EXAMLPE
var sampleRedisStructureUnique = {
	// this key contains a redis hash
	"prefix/ns/prop1/unique": {
		"asdf": "id1",
		"qwer": "id2",
		"tzui": "id3",
	}
}

// lookup unique -> should return doc with given index
// *************
// var id = redis.hget("prefix/ns/prop1/unique", "asdf");
// var doc = redis.hget("prefix/ns/", id);

// create document with unique
// ***************************
// ns, id, data provided by save method
// var unique = redis.hget("prefix/" + ns + "prop1/unique", data.prop1)
// if(unique) throw unique already exists
// 
// redis.hset("prefix/" + ns, id, data)
// redis.hset("prefix/ns/prop1/unique", data.prop1, id)

// update document with unique
// ***************************
// var olddoc = redis.hget("prefix/ns", id);
// if(olddoc.prop1 != data.prop1) -> index has changed we need to update
// 		var unique = redis.hget("prefix/" + ns + "prop1/unique", data.prop1)
// 		if(unique) -> some other item has this index throw and stop saving
// 		otherwise:
// 		redis.hdel("prefix/ns/prop1/unique", olddoc.prop1, id) -> delete old index
// 		save doc
// 		redis.hset("prefix/ns/prop1/unique", data.prop1, id) -> save new index






