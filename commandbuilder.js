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
			commandMap[type].validate[command.name] = (command[type] ? command[type].validate : false);
		}
	}
}

var registeredCommands = module.exports.registeredCommands = [];

var commandMap = module.exports.commandMap = {
	create: {
		execute: {},
		rollback: {},
		validate: {}
	},
	update: {
		execute: {},
		rollback: {},
		validate: {}
	},
	remove: {
		execute: {},
		rollback: {},
		validate: {}
	}
}

function getCommand(type, indexName, convertFunction) {
	return commandMap[type][indexName]["execute"];
}

function getRollbackCommand(type, indexName, convertFunction) {
	return commandMap[type][indexName]["rollback"];
}

