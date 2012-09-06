/**
 * Register a new command. This method takes a config 
 * object with several required values.
 * 
 * @param  {Object} command
 */
module.exports.registerCommand = function(command) {
	if(!command || (typeof command !== "object") || !command.name) {
		throw new Error("Invalid command configuration provided.");
	}
	if(registeredCommands.indexOf(command.name) === -1) {
		registeredCommands.push(command.name);
		for(var type in commandMap) {
			commandMap[type].execute[command.name] = (command[type] ? command[type].execute : false);
			commandMap[type].rollback[command.name] = (command[type] ? command[type].rollback : false);
			commandMap[type].after[command.name] = (command[type] ? command[type].after : false);
		}
	}
}

/**
 * Returns the command builder function for a givent type/index combination
 * 
 * @param  {String} type
 * @param  {String} indexName
 * @return {Function | boolean}
 */
var getCommand = module.exports.getCommand = function(type, indexName, commandType) {
	commandType = commandType || "execute";
	if(commandMap[type] && commandMap[type][commandType][indexName]) {
		return commandMap[type][commandType][indexName];
	}
	return false;
}

module.exports.executeTransaction = function() {

}

/**
 * Holds the names of already registered commands
 * @type {array}
 */
var registeredCommands = module.exports.registeredCommands = [];

/**
 * Holds command functions for all registered commands
 * @type {object}
 */
var commandMap = module.exports.commandMap = {
	create: {
		execute: {},
		rollback: {},
		after: {}
	},
	update: {
		execute: {},
		rollback: {},
		after: {}
	},
	remove: {
		execute: {},
		rollback: {},
		after: {}
	}
}

