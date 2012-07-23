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
	};

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
			expect(typeof IndexManager).toEqual("function");
		});

		it("should return a instance on construction", function(){
			expect(typeof new IndexManager()).toEqual("object");
		});

		it("should have an options object property", function(){
			expect(typeof new IndexManager().options).toEqual("object");
		});

		it("should assign given constructor options to options", function(){
			var options = {asdf: "qwer"};
			expect(new IndexManager(options).options).toEqual(options);
		});

		it("should have falsy hasIndexes flag without schema", function(){
			expect(new IndexManager().hasIndexes).toBeFalsy();
		});

		it("should have falsy hasIndex with empty schema", function(){
			expect(new IndexManager({schema: getSampleSchema()}).hasIndexes).toBeFalsy();
		});

		it("should have falsy hasIndex with non redis props", function(){
			expect(new IndexManager({schema: getSampleSchema(3)}).hasIndexes).toBeFalsy();
		});

		it("should have truthy hasIndex with redis prop", function(){
			expect(new IndexManager(getSampleConfig(2, ["index"])).hasIndexes).toBeTruthy();
		});

		it("should have falsy hasIndex with invalid redis prop", function(){
			expect(new IndexManager({schema: getSampleSchema(2, ["redis-invalid"])}).hasIndexes).toBeFalsy();
		});

		it("should have truthy hasIndex with valid string instead of array redis prop", function(){
			expect(new IndexManager(getSampleConfig(2, ["redis-string"])).hasIndexes).toBeTruthy();
		});

		it("should have falsy hasIndex with invalid redis prop type combination", function(){
			expect(new IndexManager({schema: getSampleSchema(2, ["redis-sorted-string"])}).hasIndexes).toBeFalsy();
		});

		it("should have truthy hasIndex with invalid redis prop type combo but conversion function", function(){
			expect(new IndexManager(getSampleConfig(2, ["redis-sorted-string-function"])).hasIndexes).toBeTruthy();
		});

		it("should create an indexMap entry for given redis property", function(){
			expect(typeof new IndexManager(getSampleConfig(2, ["unique"])).indexMap["prop0"] ).toEqual("object");
		});

		it("should create an indexMap entry for given redis property for each redis index type", function(){
			var map = new IndexManager(getSampleConfig(2, ["multi", "index"])).indexMap;
			expect( typeof map["prop0"]["unique"] ).toEqual("object");
			expect( typeof map["prop0"]["index"] ).toEqual("object");
			expect( typeof map["prop1"]["index"] ).toEqual("object");
		});

		it("should set conversion function for convert properties", function(){
			var map = new IndexManager(getSampleConfig(2, ["redis-sorted-string-function"])).indexMap;
			expect(typeof map["prop0"]["sorted"]).toEqual("object");
			expect(typeof map["prop0"]["sorted"]["convert"]).toEqual("function");
		});

		it("should setup prefix an default ns if no key config provided", function(){
			var manager = new IndexManager();
			expect(manager.prefix).toEqual("");
			expect(manager.ns).toEqual("default");
			expect(manager.key).toEqual("default/");
		});

		it("should setup prefix and default ns based on config", function(){
			var manager = new IndexManager({keyOptions:{prefix: "prefix", ns: "ns"}});
			expect(manager.prefix).toEqual("prefix/");
			expect(manager.ns).toEqual("ns");
			expect(manager.key).toEqual("prefix/ns/");
		});
	});
	
	describe("updateIndexes()", function(){

		it("should throw error if no connection provided", function(){
			var construct = function() {
				new IndexManager({schema: getSampleSchema(1, ["unique"])});
			}
			expect(construct).toThrow("Redis connection needed for IndexManager");
		});



	});

});