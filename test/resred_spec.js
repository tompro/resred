var resred = require("../resred"),
	resourceful = require("resourceful"),
	Resred = resred.engines.Resred,
	sinon = require("sinon");

var connection = { hset: function(){}, hget: function() {} };

describe("resred", function(){

	describe("instantiation", function(){

		it("should be registered as resourcful engine", function(){
			expect(typeof resred.engines.Resred).toEqual("function");
		});

		it("should be an object", function(){
			expect(typeof new Resred({})).toEqual("object");
		});

	});

	describe("methods", function(){

		var engine;

		beforeEach(function(){
			engine = new Resred({});
		});

		it("should throw on load()", function(){
			expect(function(){ engine.load({}); }).toThrow("Load not valid for resred engine.");
		});

		describe("buildKey()", function(){

			it("should return a hash object", function(){
				expect(typeof engine.buildKey("")).toEqual("object");
			});

			it("should return id field", function(){
				expect(engine.buildKey("1").id).toBeTruthy();
			});

			it("should return a namespace field", function(){
				expect(engine.buildKey("ns/1").ns).toBeTruthy();
			});

			it("should return correctly separated id", function(){
				expect(engine.buildKey("ns/1").id).toEqual("1");
			});

			it("should return correctly separated ns", function(){
				expect(engine.buildKey("ns/1").ns).toEqual("ns");
			});

			it("should prefix ns with prefix if set", function(){
				engine.prefix = "test";
				expect(engine.buildKey("ns/1").ns).toEqual("test:ns");
			});

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
				expect(connection.hget.calledOnce).toBeTruthy();
			});

			it("should execute callback when done", function(){
				var callback = sinon.spy();
				engine.get("ns/1", callback);
				expect(callback.calledOnce).toBeTruthy();
			});

			it("should be called with correctly prepared key arguments", function(){
				var cb = function(){};
				engine.get("ns/22", cb);
				expect(connection.hget.calledWith("ns", "22")).toBeTruthy();
			});

			it("should be called with correctly prepared key arguments and prefix", function(){
				var cb = function(){};
				engine.prefix = "test";
				engine.get("ns/1", cb);
				expect(connection.hget.calledWith("test:ns", "1")).toBeTruthy();
			});

			it("should be called with default ns if non provided", function(){
				var cb = function(){};
				engine.get(1, cb);
				expect(connection.hget.calledWith("default", 1)).toBeTruthy();
			});

		});

		describe("save()", function(){
			var engine;
			var connection = { hset: function(){}, hget: function() {} };

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
			});

			it("should call hset on connection", function(){
				engine.save("ns/1", {}, function(){});
				expect(connection.hset.calledOnce).toBeTruthy();
			});

			it("should execute callback when done", function(){
				var callback = sinon.spy();
				engine.save("ns/1", {}, callback);
				expect(callback.calledOnce).toBeTruthy();
			});

			it("should be called with correctly prepared key arguments", function(){
				var cb = function(){};
				var data = {asdf: "asdf"};

				engine.save("ns/22", data, cb);
				expect(connection.hset.calledWith("ns", "22", JSON.stringify(data) )).toBeTruthy();
			});

			it("should be called with correctly prepared key arguments and prefix", function(){
				var cb = function(){};
				var data = {asdf: "asdf"};

				engine.prefix = "test";
				engine.save("ns/1", data, cb);
				expect(connection.hset.calledWith("test:ns", "1", JSON.stringify(data))).toBeTruthy();
			});

			it("should be called with default ns if non provided", function(){
				var cb = function(){};
				var data = {asdf: "asdf"};

				engine.save(1, data, cb);
				expect(connection.hset.calledWith("default", 1, JSON.stringify(data))).toBeTruthy();
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
				expect(connection.hdel.calledOnce).toBeTruthy();
			});

			it("should invoke callback when ready", function(){
				var callback = sinon.spy();
				engine.destroy("ns/1", callback);
				expect(callback.calledOnce).toBeTruthy();
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
					expect(res.status).toEqual(500);
				});
			});

			it("should give 409 conflict when doc already exists", function(){
				sinon.stub(connection, 'hexists', function(ns, id, cb){ cb(null, 1); });
				engine.put("ns/1", {}, function(res){
					expect(res.status).toEqual(409);
				});
			});

			it("should invoke save if res does not exist and no error", function(){
				sinon.stub(connection, 'hexists', function(ns, id, cb){ cb(null, 0); });
				sinon.stub(engine, "save");
				engine.put("ns/1", {}, function(res){
					expect(engine.save.calledOnce).toBeTruthy();
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
					expect(res.status).toEqual(500);
				});
			});

			it("should give 404 not found when doc does not exists", function(){
				sinon.stub(connection, 'hexists', function(ns, id, cb){ cb(null, 0); });
				engine.post("ns/1", {}, function(res){
					expect(res.status).toEqual(404);
				});
			});

			it("should invoke save if res does exist and no error", function(){
				sinon.stub(connection, 'hexists', function(ns, id, cb){ cb(null, 1); });
				sinon.stub(engine, "save");
				engine.post("ns/1", {}, function(res){
					expect(engine.save.calledOnce).toBeTruthy();
					engine.save.restore();
				});
			});

		});

		describe("aliases", function(){
			var engine = new Resred({});

			it("should have a delete method that points to destroy", function(){
				expect(engine.delete).toEqual(engine.destroy);
			});

			it("should have a create method that points to post", function(){
				expect(engine.create).toEqual(engine.post);
			});

			it("should have a update method that points to put", function(){
				expect(engine.update).toEqual(engine.put);
			});
		});

	});

});