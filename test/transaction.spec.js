var Transaction = require("../transaction"),
	expect = require("chai").expect;

describe("Transaction", function(){

	it("should be a constructor", function() {
		expect(typeof Transaction).to.equal("function");
	});

});