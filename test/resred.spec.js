var resred = require("../resred"),
	resourceful = require("resourceful"),
	Resred = resred.Resred,
	expect = require("chai").expect,
	sinon = require("sinon");

var connection = { hset: function(){}, hget: function() {} };

describe("resred", function(){

	describe("instantiation", function(){

		it("should be registered as resourcful engine", function(){
			expect(resourceful.engines.Resred).to.be.a("function");
		});

		it("should be an object", function(){
			expect(new Resred({})).to.be.an("object");
		});

	});

	describe("methods", function(){

		var engine;

		beforeEach(function(){
			engine = new Resred({});
		});

		it("should throw on load()", function(){
			expect(function(){ engine.load({}); }).to.throw("Load not valid for resred engine.");
		});

		describe("buildKey()", function(){

			it("should return a hash object", function(){
				expect(typeof resred.buildKey("", engine.keyOptions)).to.equal("object");
			});

			it("should return id field", function(){
				expect(resred.buildKey("1", engine.keyOptions).id).to.be.ok;
			});

			it("should return a namespace field", function(){
				expect(resred.buildKey("ns/1", engine.keyOptions).ns).to.be.ok;
			});

			it("should return correctly separated id", function(){
				expect(resred.buildKey("ns/1", engine.keyOptions).id).to.equal("1");
			});

			it("should return correctly separated ns", function(){
				expect(resred.buildKey("ns/1", engine.keyOptions).ns).to.equal("ns");
			});

			it("should prefix ns with prefix if set", function(){
				engine.keyOptions.prefix = "test";
				expect(resred.buildKey("ns/1", engine.keyOptions).ns).to.equal("test/ns");
			});

		});

		describe("aliases", function(){
			var engine = new Resred({});

			it("should have a delete method that points to destroy", function(){
				expect(engine.delete).to.equal(engine.destroy);
			});

			it("should have a create method that points to post", function(){
				expect(engine.create).to.equal(engine.post);
			});

			it("should have a update method that points to put", function(){
				expect(engine.update).to.equal(engine.put);
			});
		});

	});

});