var redis = require("redis"),
	url = require("url"),
	resourceful = require("resourceful");

var Resred = exports.Resred = function(options) {
	
	options = options || {};
	this.uri = options.uri;
	this.prefix = options.prefix || "";
	this.index = options.index || {};
	this.defaultNs = options.namespace || "default";

	if(options.key) {
		this.key = options.key;
	}

	if (this.uri && !options.connection) {
		var uri = url.parse('redis://' + this.uri, true);

		this.host = uri.hostname;
		this.port = parseInt(uri.port, 10);

		if(uri.auth) {
			var auth = uri.auth.split(':');
			this.database = auth[0];
			this.pass = auth[1];
		}

		this.connection = redis.createClient(options.port, this.host);
		if (this.pass) {
			this.connection.auth(this.pass);
		}

	} else {
		this.connection = options.connection;
	}

	this.cache = new resourceful.Cache();

};

Resred.prototype.protocol = 'redis';

/**
 * Load is not implemented
 */
Resred.prototype.load = function (data) {
	throw new(Error)("Load not valid for resred engine.");
};

/**
 * Creates key structure for a given namespaced key to be used by redis
 * 
 * @param  {string} key
 * @return {object}
 */
Resred.prototype.buildKey = function(key) {
	var parts, result = {}, id, ns;
	
	if(typeof key === "string") {
		 parts = key.split('/');
	} else {
		parts = [key];
	}

	if(parts.length > 1) {
		id = parts.pop();
		ns = parts.pop();
	} else {
		id = key;
		ns = this.defaultNs;
	}

	if(this.prefix) {
		ns = this.prefix + ':' + ns;
	}

	return {
		"id": id,
		"ns": ns
	};
}

/**
 * Returns a redis entry by key. Uses the resourceful
 * key prefixing eg.: "prefix/id" where prefix is the 
 * hashs key and id the hash entrys key.
 * 
 * @param  {String|Number}   key
 * @param  {Function} cb
 * @return {mixed}
 */
Resred.prototype.get = function(key, cb) {
	var self = this,
		id = self.buildKey(key),
		doc;

	self.connection.hget(id["ns"], id["id"], function(err, val){
		if(err) {
			err.status = 500;
			return cb(err);
		}

		if(!val) {
			return cb({status: 404});
		}

		doc = JSON.parse(val);
		doc.status = 201;
		return cb(null, doc);
	});
};

/**
 * Saves a model to redis
 * @param  {String}   key A key in resourceful >3.0 format "resource/id"
 * @param  {Object}   val The data to be saved
 * @param  {Function} cb  Is called on finish or error
 */
Resred.prototype.save = function(key, val, cb) {
	var self = this, id = self.buildKey(key);
	self.connection.hset(id["ns"], id["id"], JSON.stringify(val), function(err, res) {
		if(err) {
			return cb({status: 500});
		}
		self.get(key, cb);
	});
}

/**
 * Creates a new model in redis. Uses save for creation but returns conflict error
 * if resource already exists.
 * 
 * @param  {String}   key A key in resourceful >3.0 format "resource/id"
 * @param  {Object}   val The data to be saved
 * @param  {Function} cb  Is called on finish or error
 */
Resred.prototype.put = function(key, val, cb) {
	var self = this, id = self.buildKey(key);
	self.connection.hexists(id["ns"], id["id"], function(err, res) {
		if(err) {
			return cb({status: 500});
		}

		if(res) {
			return cb({status: 409});
		} else {
			self.save(key, val, cb);
		}
	})
}

// Alias for put
Resred.prototype.update = Resred.prototype.put;

/**
 * Updates an existing model in redis. Returns an error code if an item of same type
 * with given id already exist in redis.
 * 
 * @param  {String}   key key A key in resourceful >3.0 format "resource/id"
 * @param  {Object}   val The data to be saved
 * @param  {Function} cb  Is called on finish or error
 */
Resred.prototype.post = function(key, val, cb) {
	var self = this, id = self.buildKey(key);
	self.connection.hexists(id["ns"], id["id"], function(err, res) {
		if(err) {
			return cb({status: 500});
		}

		if(res) {
			self.save(key, val, cb);
		} else {
			return cb({status: 404});
		}
	});
}

// Alias for post
Resred.prototype.create = Resred.prototype.post;

/**
 * Deletes a model from redis
 * @param  {String}   key key A key in resourceful >3.0 format "resource/id"
 * @param  {Function} cb  Is called on finish or error
 */
Resred.prototype.destroy = function(key, cb) {
	var self = this, id = self.buildKey(key);
	self.connection.hdel(id["ns"], id["id"], function(err, res){
		if(err) {
			return cb({status: 500});
		}
		cb(null, {status: 204});
	});
};

// Alias for destroy
Resred.prototype.delete = Resred.prototype.destroy;

//register engine with resourceful
resourceful.engines.Resred = Resred;

//export resourceful
module.exports = resourceful;