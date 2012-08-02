var commandBuilder = require("./commandbuilder");

var Transaction = module.exports = function(redisConnection, key, docId, newDoc, oldDoc) {
	this.commandType = oldDoc ? "update" : "create";
	if(!newDoc) this.commandType = "delete";

	this.connection = redisConnection;
	this.key = key;
	this.docId = docId;
	this.newDoc = newDoc;
	this.oldDoc = oldDoc;

	this.commands = [];
	this.rollbackCommands = [];
	this.commandArguments = [];
}

Transaction.prototype.execute = function(callback) {
	var self = this, multi = self.getMulti(), i, params;
	for(i=0; i<self.commands.length; i++) {
		if(typeof self.commands[i] === "function") {
			params = self.commandArguments[i];
			self.commands[i](
				multi, self.key, self.docId, 
				self.getNewValue(params.propName), 
				self.getOldValue(params.propName), 
				params.propName,
				params.propType,
				params.convert
			);
		}
	}

	self.getMulti().exec(function(err, res) {
		callback(err, res);
	});
}

Transaction.prototype.rollback = function(callback) {
	var self = this, multi = self.getRollbackMulti(), i;
	for(i=0; i<self.rollbackCommands.length; i++) {
		if(typeof self.rollbackCommands[i] === "function") {
			params = self.commandArguments[i];
			self.rollbackCommands[i](
				multi, self.key, self.docId,
				self.getNewValue(params.propName),
				self.getOldValue(params.propName),
				params.propName,
				params.propType,
				params.convert
			);
		}
	}

	multi.exec(function(err, res){
		callback(err, res);
	});
}

Transaction.prototype.getNewValue = function(name) {
	if(this.newDoc) {
		return this.newDoc[name];
	}
}

Transaction.prototype.getOldValue = function(name) {
	if(this.oldDoc) {
		return this.oldDoc[name];
	}
}

Transaction.prototype.retry = function(callback) {
	var self = this;
	self.getMulti().exec(function(err, res){
		callback(err, res);
	});
}

Transaction.prototype.addAction = function(propName, propType, indexType, convertFunction) {
	var self = this;
	self.commandArguments.push({
		propName: propName,
		propType: propType,
		convert: convertFunction
	});
	self.commands.push(commandBuilder.getCommand(this.commandType, indexType, "execute"));
	self.rollbackCommands.push(commandBuilder.getCommand(this.commandType, indexType, "rollback"));
}

Transaction.prototype.getMulti = function() {
	if(!this.multi) this.multi = this.connection.multi();
	return this.multi;
}

Transaction.prototype.getRollbackMulti = function() {
	if(!this.rollbackMulti) this.rollbackMulti = this.connection.multi();
	return this.rollbackMulti;
}