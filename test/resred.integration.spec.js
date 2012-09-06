var resred = require("../resred"),
	resourceful = require("resourceful"),
	Resred = resred.Resred,
	expect = require("chai").expect,
	sinon = require("sinon"),
	connection = new resred.Resred({
		uri: "localhost:6379"
	}).connection;

describe("resred", function(){

	describe("get()", function() {

		it("should read an existing document from redis", function(done) {
			done();
		});

		it("should return falsy for non existing document", function(done) {
			done();
		});

	});

	/*describe("methods", function(){

		var engine;
		beforeEach(function(){
			engine = new Resred({});
		});

		describe("get()", function(){
			var engine;

			beforeEach(function(){
				sinon.stub(connection, 'hget', function(ns, id, cb){ cb(); });
				engine = new Resred({
					connection: connection
				});
			});

			afterEach(function(){
				connection.hget.restore();
			});

			it("should call hget on redis connection", function(){
				engine.get("ns/1", function(){});
				expect(connection.hget.calledOnce).to.be.true;
			});

			it("should execute callback when done", function(){
				var callback = sinon.spy();
				engine.get("ns/1", callback);
				expect(callback.calledOnce).to.be.true;
			});

			it("should be called with correctly prepared key arguments", function(){
				var cb = function(){};
				engine.get("ns/22", cb);
				expect(connection.hget.calledWith("ns", "22")).to.be.true;
			});

			it("should be called with correctly prepared key arguments and prefix", function(){
				var cb = function(){};
				engine.keyOptions.prefix = "test";
				engine.get("ns/1", cb);
				expect(connection.hget.calledWith("test/ns", "1")).to.be.true;
			});

			it("should be called with default ns if non provided", function(){
				var cb = function(){};
				engine.get(1, cb);
				expect(connection.hget.calledWith("default", 1)).to.be.true;
			});

		});

		describe("save()", function(){
			var engine;
			var connection = { hset: function(){}, hget: function() {}, multi: function() {} };

			beforeEach(function(){
				
				sinon.stub(connection, "hset", function(ns, id, val, cb){ cb(); });
				sinon.stub(connection, 'hget', function(ns, id, cb){ cb(); });
				sinon.stub(connection, 'multi', function(ns, id, cb){ cb(); });

				engine = new Resred({
					connection: connection
				});
			});

			afterEach(function(){
				connection.hget.restore();
				connection.hset.restore();
				connection.multi.restore();
			});

			it("should call hset on connection", function(){
				engine.save("ns/1", {}, function(){});
				expect(connection.hset.calledOnce).to.be.true;
			});

			it("should execute callback when done", function(){
				var callback = sinon.spy();
				engine.save("ns/1", {}, callback);
				expect(callback.calledOnce).to.be.true;
			});

			it("should be called with correctly prepared key arguments", function(){
				var cb = function(){};
				var data = {asdf: "asdf"};

				engine.save("ns/22", data, cb);
				expect(connection.hset.calledWith("ns", "22", JSON.stringify(data) )).to.be.true;
			});

			it("should be called with correctly prepared key arguments and prefix", function(){
				var cb = function(){};
				var data = {asdf: "asdf"};

				engine.keyOptions.prefix = "test";
				engine.save("ns/1", data, cb);
				expect(connection.hset.calledWith("test/ns", "1", JSON.stringify(data))).to.be.true;
			});

			it("should be called with default ns if non provided", function(){
				var cb = function(){};
				var data = {asdf: "asdf"};

				engine.save(1, data, cb);
				expect(connection.hset.calledWith("default", 1, JSON.stringify(data))).to.be.true;
			});

		});

		describe("destroy", function(){
			var engine;
			var connection = {hdel: function(){}};

			beforeEach(function(){
				sinon.stub(connection, "hdel", function(ns, id, cb){ cb(); });
				engine = new Resred({
					connection: connection
				});
			});

			afterEach(function(){
				connection.hdel.restore();
			});

			it("should invoke hdel of connection", function(){
				engine.destroy("ns/1", function(){});
				expect(connection.hdel.calledOnce).to.be.true;
			});

			it("should invoke callback when ready", function(){
				var callback = sinon.spy();
				engine.destroy("ns/1", callback);
				expect(callback.calledOnce).to.be.true;
			});

		});

		describe("put()", function() {
			var engine;
			var connection = { hset: function(){}, hget: function() {}, hexists: function() {} };

			beforeEach(function(){
				
				sinon.stub(connection, "hset", function(ns, id, val, cb){ cb(); });
				sinon.stub(connection, 'hget', function(ns, id, cb){ cb(); });

				engine = new Resred({
					connection: connection
				});
			});

			afterEach(function(){
				connection.hget.restore();
				connection.hset.restore();
				if(connection.hexists.restore) {
					connection.hexists.restore();
				}
			});

			it("should give 500 on error", function() {
				sinon.stub(connection, 'hexists', function(ns, id, cb){ cb(true); });
				engine.put("ns/1", {}, function(res){
					expect(res.status).to.equal(500);
				});
			});

			it("should give 409 conflict when doc already exists", function(){
				sinon.stub(connection, 'hexists', function(ns, id, cb){ cb(null, 1); });
				engine.put("ns/1", {}, function(res){
					expect(res.status).to.equal(409);
				});
			});

			it("should invoke save if res does not exist and no error", function(){
				sinon.stub(connection, 'hexists', function(ns, id, cb){ cb(null, 0); });
				sinon.stub(engine, "save");
				engine.put("ns/1", {}, function(res){
					expect(engine.save.calledOnce).to.be.true;
					engine.save.restore();
				});
			});

		});

		describe("post()", function() {
			var engine;
			var connection = { hset: function(){}, hget: function() {}, hexists: function() {} };

			beforeEach(function(){
				
				sinon.stub(connection, "hset", function(ns, id, val, cb){ cb(); });
				sinon.stub(connection, 'hget', function(ns, id, cb){ cb(); });

				engine = new Resred({
					connection: connection
				});
			});

			afterEach(function(){
				connection.hget.restore();
				connection.hset.restore();
				if(connection.hexists.restore) {
					connection.hexists.restore();
				}
			});

			it("should give 500 on error", function() {
				sinon.stub(connection, 'hexists', function(ns, id, cb){ cb(true); });
				engine.post("ns/1", {}, function(res){
					expect(res.status).to.equal(500);
				});
			});

			it("should give 404 not found when doc does not exists", function(){
				sinon.stub(connection, 'hexists', function(ns, id, cb){ cb(null, 0); });
				engine.post("ns/1", {}, function(res){
					expect(res.status).to.equal(404);
				});
			});

			it("should invoke save if res does exist and no error", function(){
				sinon.stub(connection, 'hexists', function(ns, id, cb){ cb(null, 1); });
				sinon.stub(engine, "save");
				engine.post("ns/1", {}, function(res){
					expect(engine.save.calledOnce).to.be.true;
					engine.save.restore();
				});
			});

		});

	});*/

});