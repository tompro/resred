var expect = require("chai").expect,
	index = require("../../commands/index");

describe("index commands", function() {

	it("should be an object", function() {
		expect(index).to.be.an("object");
	});

	it("should have a name property with index", function() {
		expect(index.name).to.equal("index");
	});

	it("should have a create oject property", function() {
		expect(index.create).to.be.an("object");
	});

	describe("create", function() {

		var create = index.create;

		it("should have an execute function", function() {
			expect(create.execute).to.be.a("function");
		});

		describe("execute", function() {

			// now to the impl

		});

	});

});