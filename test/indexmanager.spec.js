var IndexManager = require("../indexmanager"),
	sampleProps = {
		"string": { type: 'string', messages: {}, conditions: {} },
		"unique": { redis: ["unique"], type: 'string', messages: {}, conditions: {} },
		"index": { redis: ["index"], type: 'string', messages: {}, conditions: {} },
		"number": { type: 'number', messages: {}, conditions: {} },
		"sorted": { redis: ["sorted"], type: 'number', messages: {}, conditions: {} },
		"multi": { redis: ["unique", "index"], type: 'string', messages: {}, conditions: {} },
		"redis-invalid": { redis: ["sorted", "asdf"], type: 'number', messages: {}, conditions: {} },
		"redis-string": { redis: "index", type: 'number', messages: {}, conditions: {} },
		"redis-sorted-string": { redis: ["sorted"], type: 'string', messages: {}, conditions: {} },
		"redis-sorted-string-function": { redis: [{name: "sorted", convert: function(a){return a;}}], type: 'string', messages: {}, conditions: {} }
	},
	expect = require("chai").expect;

var connectionMock = {

}

function getSampleConfig(count, types) {
	return {
		connection: connectionMock,
		keyOptions: {prefix:"", ns:"default"},
		schema: getSampleSchema(count, types)
	};
}

function getSampleSchema(count, types) {
	return createSchema(createProperties(count, types));
}

function createProperties(count, types) {
	var props = {};
	types = types || {};
	for(var i=0; i<count; i++) {
		var type = types[i] || "string";
		props["prop"+i] = sampleProps[type];
	}
	return props;
}

function createSchema(props) {
	return {
		name: "Model",
		properties: props,
		links: []
	};
}

describe("IndexManager", function(){

	describe("Constructor", function(){

		it("should be a constructor function", function(){
			expect(typeof IndexManager).to.equal("function");
		});

		it("should return a instance on construction", function(){
			expect(typeof new IndexManager()).to.equal("object");
		});

		it("should have an options object property", function(){
			expect(typeof new IndexManager().options).to.equal("object");
		});

		it("should assign given constructor options to options", function(){
			var options = {asdf: "qwer"};
			expect(new IndexManager(options).options).to.equal(options);
		});

		it("should have falsy hasIndexes flag without schema", function(){
			expect(new IndexManager().hasIndexes).to.not.be.ok;
		});

		it("should have falsy hasIndex with empty schema", function(){
			expect(new IndexManager({schema: getSampleSchema()}).hasIndexes).to.not.be.ok;
		});

		it("should have falsy hasIndex with non redis props", function(){
			expect(new IndexManager({schema: getSampleSchema(3)}).hasIndexes).to.not.be.ok;
		});

		it("should have truthy hasIndex with redis prop", function(){
			expect(new IndexManager(getSampleConfig(2, ["index"])).hasIndexes).to.be.ok;
		});

		it("should have falsy hasIndex with invalid redis prop", function(){
			expect(new IndexManager({schema: getSampleSchema(2, ["redis-invalid"])}).hasIndexes).to.not.be.ok;
		});

		it("should have truthy hasIndex with valid string instead of array redis prop", function(){
			expect(new IndexManager(getSampleConfig(2, ["redis-string"])).hasIndexes).to.be.ok;
		});

		it("should have falsy hasIndex with invalid redis prop type combination", function(){
			expect(new IndexManager({schema: getSampleSchema(2, ["redis-sorted-string"])}).hasIndexes).to.not.be.ok;
		});

		it("should have truthy hasIndex with invalid redis prop type combo but conversion function", function(){
			expect(new IndexManager(getSampleConfig(2, ["redis-sorted-string-function"])).hasIndexes).to.be.ok;
		});

		it("should create an indexMap entry for given redis property", function(){
			expect(typeof new IndexManager(getSampleConfig(2, ["unique"])).indexMap["prop0"] ).to.equal("object");
		});

		it("should create an indexMap entry for given redis property for each redis index type", function(){
			var map = new IndexManager(getSampleConfig(2, ["multi", "index"])).indexMap;
			expect( typeof map["prop0"]["unique"] ).to.equal("object");
			expect( typeof map["prop0"]["index"] ).to.equal("object");
			expect( typeof map["prop1"]["index"] ).to.equal("object");
		});

		it("should set conversion function for convert properties", function(){
			var map = new IndexManager(getSampleConfig(2, ["redis-sorted-string-function"])).indexMap;
			expect(typeof map["prop0"]["sorted"]).to.equal("object");
			expect(typeof map["prop0"]["sorted"]["convert"]).to.equal("function");
		});

		it("should setup prefix an default ns if no key config provided", function(){
			var manager = new IndexManager();
			expect(manager.prefix).to.equal("");
			expect(manager.ns).to.equal("default");
			expect(manager.key).to.equal("default/");
		});

		it("should setup prefix and default ns based on config", function(){
			var manager = new IndexManager({keyOptions:{prefix: "prefix", ns: "ns"}});
			expect(manager.prefix).to.equal("prefix/");
			expect(manager.ns).to.equal("ns");
			expect(manager.key).to.equal("prefix/ns/");
		});
	});
	
	describe("updateIndexes()", function(){

		it("should throw error if no connection provided", function(){
			var construct = function() {
				new IndexManager({schema: getSampleSchema(1, ["unique"])});
			}
			expect(construct).to.throw("Redis connection needed for IndexManager");
		});



	});

});