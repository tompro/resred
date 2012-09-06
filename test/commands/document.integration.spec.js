/**
 *
 * These tests rely on a running connectable redis instance on localhost
 * 
 */
var resred = require("../../resred"),
	commandBuilder = require("../../commandbuilder"),
	Transaction = require("../../transaction"),
	resourceful = require("resourceful"),
	redis = require("redis"),
	connection = new resred.Resred({
		uri: "localhost:6379"
	}).connection,
	expect = require("chai").expect;


describe("document commands", function() {

	var testdoc = {"key":"value"};

	beforeEach(function(done) {
		connection.flushdb();
		done();
	});

	it("should be an autoregistered command", function() {
		expect(commandBuilder.registeredCommands.indexOf("resred-document")).to.not.equal(-1);
	});

	describe("create", function() {

		var trans;
		beforeEach(function() {
			trans = new Transaction(connection, "create", "mytype", "myid", testdoc);
		});

		describe("execute", function() {
			it("should save a new document into the correct redis hash", function(done) {

				trans.execute(function(err, res) {
					expect(err).to.be.not.ok;
					connection.hget("mytype", "myid", function(err, doc) {
						expect(JSON.parse(doc)).to.deep.equal(testdoc);
						done();
					});
				});

			});
		});

		describe("rollback", function() {
			it("should remove the document", function(done) {
				trans.execute(function(err, res) {
					expect(err).to.be.not.ok;
					trans.rollback(function(err, res) {
						expect(err).to.be.not.ok;
						connection.hget("mytype", "myid", function(err, doc) {
							expect(doc).to.not.be.ok;
							done();
						});
					});
				});
			});
		});

	});

	describe("update", function() {

		var trans, olddoc = {"old":"value"};
		beforeEach(function(done) {
			connection.hset("mytype", "myid", olddoc, function(err, res) {
				done();
			});
			trans = new Transaction(connection, "update", "mytype", "myid", testdoc, olddoc);
		});

		describe("execute", function() {
			it("should save the new doc in place of the old one", function(done) {
				trans.execute(function(err, res) {
					expect(err).to.be.not.ok;
					connection.hget("mytype", "myid", function(err, doc) {
						expect(JSON.parse(doc)).to.deep.equal(testdoc);
						done();
					});
				});
			});

		});

		describe("rollback", function() {
			it("should restore the old document", function(done) {
				trans.execute(function(err, res) {
					expect(err).to.be.not.ok;
					trans.rollback(function(err, res) {
						expect(err).to.be.not.ok;
						connection.hget("mytype", "myid", function(err, doc) {
							expect(JSON.parse(doc)).to.deep.equal(olddoc);
							done();
						});
					});
				})
			});
		});

	});

	describe("remove", function() {

		var trans, olddoc = {"old":"value"};
		beforeEach(function(done) {
			connection.hset("mytype", "myid", olddoc, function(err, res) {
				done();
			});
			trans = new Transaction(connection, "remove", "mytype", "myid", null, olddoc);
		});

		describe("execute", function() {
			it("should delete the document from redis", function(done) {
				trans.execute(function(err, res) {
					expect(err).to.not.be.ok;
					expect(res).to.deep.equal([1]);
					done();
				})
			});
		});

		describe("rollback", function() {
			it("should restore the previously deleted document", function(done) {
				trans.execute(function(err, res) {
					expect(err).to.not.be.ok;
					trans.rollback(function(err, res) {
						expect(err).to.not.be.ok;
						connection.hget("mytype", "myid", function(err, doc) {
							expect(JSON.parse(doc)).to.deep.equal(olddoc);
							done();
						});
					})
				});
			});
		});

	});

});