var docCommand = require('./commands/document'),
	commandBuilder = require("./commandbuilder"),
	crypto = require('crypto');

var Transaction = module.exports = function(redisConnection, commandType, key, docId, newDoc, oldDoc) {
	this.commandType = commandType;
	this.connection = redisConnection;
	this.key = key;
	this.docId = docId;
	this.newDoc = newDoc;
	this.oldDoc = oldDoc;

	this.commands = [];
	this.rollbackCommands = [];
	this.commandArguments = [];

	// add basic document operation commands
	this.addAction(null, null, "resred-document");
}

Transaction.prototype.execute = function(callback) {
	var params, self = this, multi = self.getMulti(), i;
	for(i=0; i<self.commands.length; i++) {
		if(typeof self.commands[i] === "function") {
			params = self.commandArguments[i];
			self.commands[i].call(
				self,
				multi,
				params.propName,
				params.propType,
				params.convert
			);
		}
	}

	multi.exec(function(err, res) {
		callback(err, res);
	});
}

Transaction.prototype.rollback = function(callback) {
	var params, self = this, multi = self.getRollbackMulti(), i;
	for(i=0; i<self.rollbackCommands.length; i++) {
		if(typeof self.rollbackCommands[i] === "function") {
			params = self.commandArguments[i];
			self.rollbackCommands[i].call(
				self,
				multi,
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

Transaction.prototype.hash = function(val) {
	return crypto.createHash('md5').update(val).digest("hex");
}
