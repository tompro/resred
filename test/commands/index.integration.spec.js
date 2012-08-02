/**
 *
 * These test rely on a running connectable redis instance on localhost
 * 
 */
var resred = require("../../resred"),
	commandBuilder = require("../../commandbuilder"),
	Transaction = require("../../transaction"),
	index = require("../../commands/index"),
	resourceful = require("resourceful"),
	redis = require("redis"),
	crypto = require("crypto"),
	connection = new resred.Resred({
		uri: "localhost:6379"
	}).connection,
	expect = require("chai").expect;


describe("index commands", function() {

	beforeEach(function(done) {
		connection.flushdb();
		done();
	});

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
		var trans;
		beforeEach(function() {
			trans = new Transaction(connection, "mytype/", "myid", {
				"first": "asdf",
				"second": 22,
				"third": .12,
				"forth": ["qwer", "tzui"],
				"fifth": {"asdf":"qwer"}
			})
		});

		it("should have an execute function", function() {
			expect(create.execute).to.be.a("function");
		});

		describe("execute, rollback and retry", function() {

			it("should create remove and reset correct index for string", function(done) {
				trans.addAction("first", "string", "index");
				var key = crypto.createHash('md5').update("asdf").digest("hex");

				trans.execute(function(err, res) {

					connection.smembers("mytype/first/" + key, function(err, res) {

						expect(res[0]).to.equal("myid");
						trans.rollback(function(err, res) {

							expect(res[0]).to.equal(1);
							connection.smembers("mytype/first/" + key, function(err, res) {

								expect(res.length).to.equal(0);
								trans.retry(function(err, res) {

									expect(err).not.to.be.ok;
									connection.smembers("mytype/first/" + key, function(err, res) {
										
										expect(res[0]).to.equal("myid");
										done();
									});
								});
							});
						});
					});
				});
			});

			it("should create correct index for int number", function(done) {
				trans.addAction("second", "number", "index");
				var key = crypto.createHash('md5').update(String(22)).digest("hex");
				trans.execute(function(err, res) {
					connection.smembers("mytype/second/" + key, function(err, res) {
						expect(res[0]).to.equal("myid");
						done();
					});
				});
			});

			it("should create correct index for float number", function(done) {
				trans.addAction("third", "number", "index");
				var key = crypto.createHash('md5').update(String(0.12)).digest("hex");

				trans.execute(function(err, res) {
					connection.smembers("mytype/third/" + key, function(err, res) {
						expect(res[0]).to.equal("myid");
						done();
					});
				});
			});

			it("should create multiple indexes for array", function(done) {
				trans.addAction("forth", "array", "index");
				var key = crypto.createHash('md5').update("qwer").digest("hex");
				var key2 = crypto.createHash('md5').update("tzui").digest("hex");
				trans.execute(function(err, res) {
					connection.smembers("mytype/forth/" + key, function(err, res) {
						expect(res[0]).to.equal("myid");
						connection.smembers("mytype/forth/" + key2, function(err, res) {
							expect(res[0]).to.equal("myid");
							done();
						});	
					});
				});
			});

			it("should create correct single index for object", function(done) {
				trans.addAction("fifth", "object", "index");
				var key = crypto.createHash('md5').update(JSON.stringify({"asdf":"qwer"})).digest("hex");

				trans.execute(function(err, res) {
					connection.smembers("mytype/fifth/" + key, function(err, res) {
						expect(res[0]).to.equal("myid");
						done();
					});
				});
			});

		});

	});

});

