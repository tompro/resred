var IndexManager = require("../indexmanager"),
	sampleProps = {
		"string": { type: 'string', messages: {}, conditions: {} },
		"unique": { redis: ["unique"], type: 'string', messages: {}, conditions: {} },
		"index": { redis: ["unique"], type: 'string', messages: {}, conditions: {} },
		"number": { type: 'number', messages: {}, conditions: {} },
		"sorted": { redis: ["sorted"], type: 'number', messages: {}, conditions: {} },
		"redis-invalid": { redis: ["sorted", "asdf"], type: 'number', messages: {}, conditions: {} },
		"redis-string": { redis: "index", type: 'number', messages: {}, conditions: {} },
		"redis-sorted-string": { redis: ["sorted"], type: 'string', messages: {}, conditions: {} },
		"redis-sorted-string-function": { redis: [{name: "sorted", convert: function(a){return a;}}], type: 'string', messages: {}, conditions: {} }
	};

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
	}
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
			expect(new IndexManager({schema: getSampleSchema(2, ["index"])}).hasIndexes).toBeTruthy();
		});

		it("should have falsy hasIndex with invalid redis prop", function(){
			expect(new IndexManager({schema: getSampleSchema(2, ["redis-invalid"])}).hasIndexes).toBeFalsy();
		});

		it("should have truthy hasIndex with valid string instead of array redis prop", function(){
			expect(new IndexManager({schema: getSampleSchema(2, ["redis-string"])}).hasIndexes).toBeTruthy();
		});

		it("should have falsy hasIndex with invalid redis prop type combination", function(){
			expect(new IndexManager({schema: getSampleSchema(2, ["redis-sorted-string"])}).hasIndexes).toBeFalsy();
		});

		it("should have truthy hasIndex with invalid redis prop type combo but conversion function", function(){
			expect(new IndexManager({schema: getSampleSchema(2, ["redis-sorted-string-function"])}).hasIndexes).toBeTruthy();
		});
	});

});