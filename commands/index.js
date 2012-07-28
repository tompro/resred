function createIndex(multi, key, docId, newDoc, oldDoc, o) {
	return multi.sadd(buildIndexKey(key, o.propName, o.propValue), docId);
}

function removeIndex(multi, key, docId, newDoc, oldDoc, o) {
	return multi.srem(buildIndexKey(key, o.propName, o.propValue), docId);
}

function updateIndex(multi, key, docId, newDoc, oldDoc, o) {
	createIndex(multi, key, docId, newDoc, oldDoc, o);
	removeIndex(multi, key, docId, newDoc, oldDoc, o);
}

function rollbackIndexUpdate(multi, key, docId, newDoc, oldDoc, o) {
	createIndex(multi, key, docId, oldDoc, newDoc, o);
	removeIndex(multi, key, docId, oldDoc, newDoc, o);
}

function buildIndexKey(key, propName, propValue) {
	return key + propName + "/" + propValue;
}

var sampleCommand = {
		name: "sample",
		create: {
			execute: function(a) {a+6},
			rollback: function(b) {b+5},
			validate: function(g) {g+7}
		},
		update: {
			execute: function(c) {c+4},
			rollback: function(d) {d+3},
			validate: function(h) {h+8}
		},
		remove: {
			execute: function(e) {e+2},
			rollback: function(f) {f+1},
			validate: function(i) {i+9}
		}
	}

module.exports = {
	name: "index",
	create: {
		execute: createIndex
	}
}