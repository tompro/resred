/**
 *
 * These test rely on a running connectable redis instance on localhost
 * 
 */
var resred = require("../resred"),
	resourceful = require("resourceful"),
	redis = require("redis"),
	connection = redis.createClient();

connection.flushdb();

describe("resred", function(){

	describe("redis connection", function(){

		it("should connect from connection string", function(){
			var Test1 = resourceful.define("test1", function(){
				this.use("resred", {
					uri: "localhost:6379"
				});
			});

			expect(typeof Test1.engine).toEqual("function");
		});

		it("should use an existing connection", function(){
			var Test2 = resourceful.define("test2", function(){
				this.use("resred", {
					connection: connection
				});
			});

			expect(typeof Test2.engine).toEqual("function");
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
		console.log(item.schema);

		it("should save a value in the correct place", function(){
			item.save(function(err, res) {
				expect(res.uniquename).toEqual(data.uniquename);
				expect(res.id).toEqual(item.id);
			});
			waits(100);
		});

		it("should fetch correct data from redis", function(){
			Model.get(item.id, function(err, res){
				expect(res.indexedname).toEqual(data.indexedname);
			});
			waits(100);
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

		it("should delete hash value at key", function(){
			item.save(function(err, res) {
				connection.hexists("other", res.id, function(err, res){
					expect(res).toEqual(1);
				});
			});

			waits(100);


		});


	});

});