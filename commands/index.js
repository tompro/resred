var commandBuilder = require("../commandbuilder"),
	command = module.exports = {
	
	// Name of the command (index name)
	name: "index",

	// Doc creation functions
	create: {
		/**
		 * Creates an index for a new document
		 * @param  {RedisMulti} multi
		 * @param  {String} name The name of the property
		 * @param  {String} type The resourceful type of the property
		 * @param  {Function} convert An optional convert function
		 * @return {RedisMulti}
		 */
		execute: function (multi, name, type, convert) {
			var valueKey = buildValueKey(this.getNewValue(name), type);
			return addMulti.call(this, "sadd", multi, valueKey, name);
		},

		/**
		 * Rolls back a previously executed index create
		 * @param  {RedisMulti} multi
		 * @param  {String} name The name of the property
		 * @param  {String} type The resourceful type of the property
		 * @param  {Function} convert An optional convert function
		 * @return {RedisMulti}
		 */
		rollback: function (multi, name, type, convert) {
			var valueKey = buildValueKey(this.getNewValue(name), type);
			return addMulti.call(this, "srem", multi, valueKey, name);
		}
	},

	// Doc update functions
	update: {

		/**
		 * Updates a document index and cleans up old indexes
		 * @param  {RedisMulti} multi
		 * @param  {String} name The name of the property
		 * @param  {String} type The resourceful type of the property
		 * @param  {Function} convert An optional convert function
		 * @return {RedisMulti}
		 */
		execute: function updateIndex(multi, name, type, convert) {
			var valueKey = buildValueKey(this.getNewValue(name), type);
			var oldValueKey = buildValueKey(this.getOldValue(name), type);
			addMulti.call(this, "sadd", multi, valueKey, name);
			addMulti.call(this, "srem", multi, oldValueKey, name);
			return multi;
		},

		/**
		 * Rolls back a previously executed index update
		 * @param  {RedisMulti} multi
		 * @param  {String} name The name of the property
		 * @param  {String} type The resourceful type of the property
		 * @param  {Function} convert An optional convert function
		 * @return {RedisMulti}
		 */
		rollback: function (multi, name, type, convert) {
			var valueKey = buildValueKey(this.getNewValue(name), type);
			var oldValueKey = buildValueKey(this.getOldValue(name), type);
			addMulti.call(this, "sadd", multi, oldValueKey, name);
			addMulti.call(this, "srem", multi, valueKey, name);
			return multi;
		}
	},

	// Doc delete functions
	remove: {

		/**
		 * Deletes an existing index
		 * @param  {RedisMulti} multi
		 * @param  {String} name The name of the property
		 * @param  {String} type The resourceful type of the property
		 * @param  {Function} convert An optional convert function
		 * @return {RedisMulti}
		 */
		execute: function deleteIndex(multi, name, type, convert) {
			var valueKey = buildValueKey(this.getOldValue(name), type);
			return addMulti.call(this, "srem", multi, valueKey, name);
		},

		/**
		 * Rolls back a previously executed index delete
		 * @param  {RedisMulti} multi
		 * @param  {String} name The name of the property
		 * @param  {String} type The resourceful type of the property
		 * @param  {Function} convert An optional convert function
		 * @return {RedisMulti}
		 */
		rollback: function rollbackDeleteIndex(multi, name, type, convert) {
			var valueKey = buildValueKey(this.getOldValue(name), type);
			return addMulti.call(this, "sadd", multi, valueKey, name);
		}
	}
};

/**
 * Removes an existing index entry
 * @param  {String} command The redis command to add
 * @param  {RedisMulti} multi
 * @param  {String|Array} valueKey
 * @param  {String} name The property name to work on
 * @return {RedisMulti}
 */
function addMulti(command, multi, valueKey, name) {
	if(Array.isArray(valueKey)) {
		for(var i=0; i<valueKey.length; i++) {
			multi[command](buildIndexKey(this.key, name, this.hash(valueKey[i])), this.docId);
		}
		return multi
	}
	return multi[command](buildIndexKey(this.key, name, this.hash(valueKey)), this.docId);
}

/**
 * Internal function to create a proper index key.
 * @param  {String} key The resource key (may contain a prefix)
 * @param  {String} propName  The properties name
 * @param  {String} propValue The properties value (may be converted has to be a string at this point)
 * @return {String}
 */
function buildIndexKey(key, propName, propValue) {
	return key + propName + "/" + propValue;
}

/**
 * Creates a string representation from a given value to be used as 
 * an index key. Can return an array of keys if necessary.
 * 
 * @param  {mixed} val  The key
 * @param  {String} type The data type
 * @return {String|Array}
 */
function buildValueKey(val, type) {
	if(type === "array") {
		var result = [];
		for(var i=0; i<val.length; i++) {
			result.push(buildValueKey(val[i]));
		}
		return result;
	}
	if(type === "object") {
		return JSON.stringify(val);
	}
	return String(val);
}

// register command in command builder
commandBuilder.registerCommand(command);