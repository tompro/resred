var expect = require('chai').expect,
	commandBuilder = require("../commandbuilder");

describe("commandBuilder", function(){

	var commands = commandBuilder.commandMap;
	var registered = commandBuilder.registeredCommands;

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

	var sampleCreateCommand = {
		name: "samplecreate",
		create: sampleCommand.create
	}

	describe("registerCommand", function(){

		it("should be a function", function() {
			expect(commandBuilder.registerCommand).to.be.a("function");
		});

		it("should throw if no command object provided", function() {
			expect(function(){commandBuilder.registerCommand()}).to.throw();
		});

		it("should throw if no command name provided", function() {
			expect(function(){commandBuilder.registerCommand({})}).to.throw();
		});

		it("should throw if no object provided", function() {
			expect(function(){commandBuilder.registerCommand("")}).to.throw();
		});

		it("should add the command name to its registered commands", function() {
			commandBuilder.registerCommand({
				name: "testcommand"
			});
			expect(registered.indexOf("testcommand")).to.be.above(-1);
		});

		it("should register a command only once", function() {
			var testcommand = {name: "testcommand"}
			commandBuilder.registerCommand(testcommand);
			commandBuilder.registerCommand(testcommand);
			expect(registered.length).to.equal(1);
		});

		it("should register execute function for create", function() {
			commandBuilder.registerCommand(sampleCreateCommand);
			expect(commands.create.execute["samplecreate"]).to.be.a("function");
		});

		it("should register a falsy command for all commands not provided by config", function() {
			commandBuilder.registerCommand(sampleCreateCommand);
			expect(commands.update.execute["samplecreate"]).to.not.be.ok;
		});

		it("should register execute function for all config commands in right place", function() {
			commandBuilder.registerCommand(sampleCommand);
			for(var type in commands) {
				for(var action in commands[type]) {
					expect(commands[type][action][sampleCommand.name]).to.equal(sampleCommand[type][action]);
				}
			}
		});
	});

	it("should have a commandMap property", function() {
		expect(commandBuilder.commandMap).to.be.an("object");
	});
	

});
