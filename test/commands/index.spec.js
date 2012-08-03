var expect = require("chai").expect,
	index = require("../../commands/index"),
	sinon = require("sinon");

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
		var multi = {
			sadd: function(){},
			srem: function(){}
		};

		beforeEach(function(){
			sinon.stub(multi, "sadd");
			sinon.stub(multi, "srem");
		});

		afterEach(function() {
			multi.sadd.restore();
			multi.srem.restore();
		});

		it("should have an execute function", function() {
			expect(create.execute).to.be.a("function");
		});

		describe("execute", function() {
			var func = create.execute;

			it("should call sadd on multi", function() {
				func(multi, "asdf/", "1", {myindex: "theindex"}, undefined, {propName: "myindex"});
				expect(multi.sadd.calledOnce).to.be.true;
			});

			it("should call sadd with correct arguments", function() {
				func(multi, "asdf/", "1", {myindex: "theindex"}, undefined, {propName: "myindex"});
				expect(multi.sadd.calledWith("asdf/myindex/theindex", "1")).to.be.true;
			});
			
		});

	});

});