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

var commandMap = {
	"create": {
		"execute": { 
			"index": createIndex
		},
		"rollback": {
			"index": removeIndex
		}
	},

	"update": {
		"execute": {
			"index": updateIndex
		},
		"rollback": {
			"index": rollbackIndexUpdate
		}
		
	},

	"remove": {
		"execute": {
			"index": removeIndex
		},
		"rollback": {
			"index": createIndex
		}
		
	}
}