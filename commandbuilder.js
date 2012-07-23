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

function saveDoc(multi, key, docId, newDoc) {

}

function deleteDoc(multi, key, docId) {

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

	"delete": {
		"execute": {
			"index": removeIndex
		},
		"rollback": {
			"index": createIndex
		}
		
	}
}

function getCommand(type, indexName, convertFunction) {
	return commandMap[type][indexName]["execute"];
}

function getRollbackCommand(type, indexName, convertFunction) {
	return commandMap[type][indexName]["rollback"];
}

var Transaction = function(redisConnection, key, docId, newDoc, oldDoc) {
	this.commandType = oldDoc ? "update" : "create";
	if(!newDoc) this.commandType = "delete";

	this.connection = redisConnection;
	this.key = key;
	this.docId = docId;
	this.newDoc = newDoc;
	this.oldDoc = oldDoc;

	this.commands = [];
	this.rollback = [];
	this.commandArguments = [];
}

Transaction.prototype.execute = function(callback) {
	var self = this, i;
	for(i=0; i<self.commands.length; i++) {
		self.commands[i](self.getMulti(), self.key, self.docId, self.newDoc, self.oldDoc, self.commandArguments[i]);
	}

	self.getMulti().exec(function(err, res) {
		console.log(res);
	});
}

Transaction.prototype.rollback = function(callback) {
	var self = this, i;
	for(i=0; i<self.rollback.length; i++) {
		self.rollback[i](self.getRollbackMulti(), self.key, self.docId, self.newDoc, self.oldDoc, self.commandArguments[i]);
	}

	self.getRollbackMulti().exec(function(err, res){
		console.log(res);
	});
}

Transaction.prototype.retry = function(callback) {
	var self = this;
	self.getMulti().exec(function(err, res){
		console.log(res);
	});
}

Transaction.prototype.addAction = function(propName, indexType, convertFunction) {
	var self = this;
	self.commandArguments.push({
		propName: propName,
		convert: convertFunction
	});
	self.commands.push(getCommand(this.commandType, indexType, convertFunction));
	self.rollback.push(getRollbackCommand(this.commandType, indexType, convertFunction));
}

Transaction.prototype.getMulti = function() {
	if(!this.multi) this.multi = this.connection.multi();
	return this.multi;
}

Transaction.prototype.getRollbackMulti = function() {
	if(!this.rollbackMulti) this.rollbackMulti = this.connection.multi();
	return this.rollbackMulti;
}