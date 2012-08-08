var commandBuilder = require("../commandbuilder"),
	crypto = require('crypto'),
	command;

function createIndex(multi, key, docId, newVal, oldVal, name, type, convert) {
	var valueKey = buildValueKey(newVal, type);
	if(Array.isArray(valueKey)) {
		for(var i=0; i<valueKey.length; i++) {
			multi.sadd(buildIndexKey(key, name, valueKey[i]), docId);
		}
		return multi;
	}

	return multi.sadd(buildIndexKey(key, name, valueKey), docId);
}

function create(multi, name, type, convert) {
	var valueKey = buildValueKey(this.getNewValue(name), type);
	if(Array.isArray(valueKey)) {
		for(var i=0; i<valueKey.length; i++) {
			return multi.sadd(buildIndexKey(this.key, name, valueKey[i]), this.docId);
		}
		return multi;
	}
	return multi.sadd(buildIndexKey(this.key, name, valueKey), this.docId);
}

function removeIndex(multi, key, docId, newVal, oldVal, name, type, convert) {
	var valueKey = buildValueKey(newVal, type);
	if(Array.isArray(valueKey)) {
		for(var i=0; i<valueKey.length; i++) {
			multi.srem(buildIndexKey(key, name, valueKey[i]), docId);
		}
		return multi;
	}

	return multi.srem(buildIndexKey(key, name, valueKey), docId);
}

function updateIndex(multi, key, docId, newVal, oldVal, name, type, convert) {
	createIndex(multi, key, docId, newVal, oldVal, name, type, convert);
	removeIndex(multi, key, docId, newVal, oldVal, name, type, convert);
}

function rollbackIndexUpdate(multi, key, docId, newVal, oldVal, name, type, convert) {
	createIndex(multi, key, docId, oldVal, newVal, name, type, convert);
	removeIndex(multi, key, docId, oldVal, newVal, name, type, convert);
}

function buildIndexKey(key, propName, propValue) {
	return key + propName + "/" + propValue;
}

function buildValueKey(val, type) {
	
	if(type === "array") {
		var result = [];
		for(var i=0; i<val.length; i++) {
			result.push(buildValueKey(val[i]));
		}
		return result;
	}

	if(type === "object") {
		return md5(JSON.stringify(val));
	}

	return md5(String(val));
}

function md5(val) {
	return crypto.createHash('md5').update(val).digest("hex");
}

command = {
	name: "index",
	create: {
		execute: createIndex,
		rollback: removeIndex
	},
	update: {
		execute: updateIndex,
		rollback: rollbackIndexUpdate
	},
	remove: {
		execute: removeIndex,
		rollback: createIndex
	}
}

commandBuilder.registerCommand(command);
module.exports = command;
