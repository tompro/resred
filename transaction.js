var Transaction = module.exports = function(redisConnection, key, docId, newDoc, oldDoc) {
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