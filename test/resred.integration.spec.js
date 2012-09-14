var resred = require("../resred"),
	resourceful = require("resourceful"),
	Resred = resred.Resred,
	expect = require("chai").expect,
	sinon = require("sinon"),
	engine = new resred.Resred({
		uri: "localhost:6379"
	}),
	connection = engine.connection;

describe("resred", function(){

	var TestResource = resourceful.define("testresource", function(){
		this.use("resred");

		this.string("id");
		this.string("indexedname", {
			redis: ["index"]
		});
	});

	var testDoc = {
		"id": "myid",
		"indexedname": "myname"
	};

	afterEach(function(done) {
		connection.flushdb(function() {
			done();
		});
	});

	describe("get()", function() {

		beforeEach(function(done) {
			connection.hset("testresource", "myid", JSON.stringify(testDoc), function(err, res) {
				done();
			});
		});

		it("should read an existing document from redis", function(done) {
			TestResource.get("myid", function(err, res) {
				expect(err).to.not.be.ok;
				expect(res).to.be.an('object');
				expect(res.status).to.equal(200);
				done();
			});
			
		});

		it("should return 404 err for non existing document", function(done) {
			TestResource.get("nonid", function(err, res) {
				expect(err.status).to.equal(404);
				done();
			});
		});

	});

	describe("save()", function() {

		it("should save a new document to redis", function(done) {
			var myres = new TestResource({
				"id": "otherid",
				"indexedname": "othername"
			});

			myres.save(function(err, res) {
				expect(err).to.not.be.ok;
				expect(res.status).to.equal(200);
				done();
			});

		});

		it("should update an existing document in redis", function(done) {
			var myres = new TestResource({
				"id": "otherid",
				"indexedname": "othername"
			});

			myres.save(function(err, res) {
				expect(err).to.not.be.ok;
				myres.indexedname = "newname";
				myres.save(function(err, res) {
					expect(err).to.be.not.ok;
					expect(res.status).to.equal(200);
					expect(res.indexedname).to.equal("newname");
					done();
				});
			});

		});

	});

	describe("destroy()", function() {

		it("should remove an existing document from redis", function(done) {
			var myres = new TestResource({
				"id": "otherid",
				"indexedname": "othername"
			});

			myres.save(function(err, res) {
				expect(res.status).to.equal(200);
				myres.destroy(function(err, res) {
					expect(err).to.not.be.ok;
					expect(res.status).to.equal(204);

					connection.hget("testresource", "otherid", function(err, res) {
						expect(err).to.not.be.ok;
						expect(res).to.equal(null);
						done();
					})
				});
			});
		});

		it("should return correct status when removing a non existing document", function(done) {
			var myres = new TestResource({
				"id": "otherid",
				"indexedname": "othername"
			});

			myres.destroy(function(err, res) {
				expect(res.status).to.equal(204);
				done();
			});
		});
		
	});

	describe("create() / post()", function() {

		it("should return conflict error when called for an existing document", function(done) {
			var myres = new TestResource({
				"id": "myid",
				"indexedname": "othername"
			});

			myres.save(function(err, res) {

				engine.create("testresource/myid", {
					"id": "myid",
					"indexedname": "name"
				}, function(err, res) {
					expect(err.status).to.equal(409);
					done();
				});

			});

		});

		it("should create new document in redis if none is existing", function(done) {

			engine.create("testresource/myid", testDoc, function(err, res) {
				expect(err).to.not.be.ok;
				expect(res.status).to.equal(200);
				TestResource.get("myid", function(err, doc) {
					expect(doc.indexedname).to.equal("myname");
				});
				done();
			})

		});

	});

	describe("update() / put()", function() {

		it("should return 404 error when updateing a non existing doc", function(done) {

			engine.put("testresource/myid", testDoc, function(err, res) {
				expect(err.status).to.equal(404);
				done();
			});

		});

		it("should update doc in redis if doc does already exist", function(done) {

			var myres = new TestResource(testDoc);
			myres.save(function(err, res) {
				expect(res.status).to.equal(200);
				engine.put("testresource/myid", {id:"myid", indexedname: "newname"}, function(err, res) {
					expect(res.status).to.equal(200);
					expect(res.indexedname).to.equal("newname");
					done();
				});
			}) 

		});

	});

});