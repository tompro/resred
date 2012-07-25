/**
 *
 * These test rely on a running connectable redis instance on localhost
 * 
 */
var resred = require("../resred"),
	resourceful = require("resourceful"),
	redis = require("redis"),
	connection = new resred.Resred({
		uri: "localhost:6379"
	}).connection,
	expect = require("chai").expect;

connection.flushdb();

describe("resred", function(){

	describe("redis connection", function(){

		var tmpcon;

		it("should connect from connection string", function(){
			var Test1 = resourceful.define("test1", function(){
				this.use("resred", {
					uri: "localhost:6379"
				});
			});

			expect(typeof Test1.engine).to.equal("function");
			tmpcon = Test1.engine.connection;
		});

		it("should use an existing connection", function(){
			var Test2 = resourceful.define("test2", function(){
				this.use("resred", {
					connection: connection
				});
			});

			expect(typeof Test2.engine).to.equal("function");
		});

		it("should resuse connection if same connection string", function(){
			var Test3 = resourceful.define("test3", function(){
				this.use("resred", {
					uri: "localhost:6379"
				});
			});

			expect(tmpcon).to.equal(Test3.engine.connection);
		});

	});

	describe("set()", function(){

		var Model = resourceful.define("model", function(){
			this.use("resred", {
				connection: connection
			});

			this.string("id");
			this.string("uniquename", {
				redis: ["unique"]
			});
			this.string("indexedname", {
				redis: ["index"]
			});
			this.number("sorted", {
				redis: ["sort"]
			});
		});

		var data = {
			uniquename: "MyUniqueName",
			indexedname: "MyIndexedName",
			sorted: 1
		}

		var item = new Model(data);

		it("should save a value in the correct place", function(done){
			item.save(function(err, res) {
				expect(res.uniquename).to.equal(data.uniquename);
				expect(res.id).to.equal(item.id);
				done();
			});
		});

		it("should fetch correct data from redis", function(done){
			Model.get(item.id, function(err, res){
				expect(res.indexedname).to.equal(data.indexedname);
				done();
			});
		});


	});

	describe("destroy()", function(){

		var Other = resourceful.define("other", function(){
			this.use("resred", {
				connection: connection
			});
			this.string("id");
			this.string("some");
		});

		var data = {some: "other"};
		var item = new Other(data);

		it("should delete hash value at key", function(done){
			item.save(function(err, res) {
				connection.hexists("other", res.id, function(err, res){
					expect(res).to.equal(1);
					done();
				});
			});

		});


	});

});