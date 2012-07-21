var redis = require("redis");

var validIndexes = {
	"unique": [],
	"index": [],
	"sorted": ["number"]
};

var IndexManager = module.exports = function(options) {
	
	this.hasIndexes = false;
	this.indexMap = {};

	this.options = options || {};
	if(this.options.schema) {
		this.setupSchema(options.schema);
	}

}

IndexManager.prototype.setupSchema = function(schema) {
	var self = this, name, prop, properties = schema.properties;
	if(!properties) return;
	
	for (name in properties) {
		prop = properties[name];
		if(prop.redis && typeof prop.redis === "string") {
			prop.redis = [prop.redis]
		}
		if(self.validateProperty(prop) ) {
			this.hasIndexes = true;

		}
		console.log(name, properties[name]);
	}
}

IndexManager.prototype.addIndexedProperty = function(property) {

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


var indexTypes = ["unique", "index", "sorted"];

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

// updateIndex(ns, id, name, value) {
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



// INDEX EXAMPLE

var sampleRedisStructureIndex = {
	// those keys contain a redis list
	"prefix/ns/prop2/asdf": ["id1"],
	"prefix/ns/prop2/qwer": ["id2"],
	"prefix/ns/prop2/tzui": ["id3"]
}


