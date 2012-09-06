var commandBuilder = require("../commandbuilder"),
	command = module.exports = {
	
	// Name of the command (index name)
	name: "resred-document",

	// Doc creation functions
	create: {
		/**
		 * Creates a new document
		 * @param  {RedisMulti} multi
		 * @param  {String} name The name of the property
		 * @param  {String} type The resourceful type of the property
		 * @param  {Function} convert An optional convert function
		 * @return {RedisMulti}
		 */
		execute: function (multi, name, type, convert) {
			multi.hset(this.key, this.docId, JSON.stringify(this.newDoc));
		},

		/**
		 * Rolls back a previously executed document create
		 * @param  {RedisMulti} multi
		 * @param  {String} name The name of the property
		 * @param  {String} type The resourceful type of the property
		 * @param  {Function} convert An optional convert function
		 * @return {RedisMulti}
		 */
		rollback: function (multi, name, type, convert) {
			multi.hdel(this.key, this.docId);
		}
	},

	// Doc update functions
	update: {

		/**
		 * Updates a document
		 * @param  {RedisMulti} multi
		 * @param  {String} name The name of the property
		 * @param  {String} type The resourceful type of the property
		 * @param  {Function} convert An optional convert function
		 * @return {RedisMulti}
		 */
		execute: function (multi, name, type, convert) {
			multi.hset(this.key, this.docId, JSON.stringify(this.newDoc));
		},

		/**
		 * Rolls back a previously executed document update
		 * @param  {RedisMulti} multi
		 * @param  {String} name The name of the property
		 * @param  {String} type The resourceful type of the property
		 * @param  {Function} convert An optional convert function
		 * @return {RedisMulti}
		 */
		rollback: function (multi, name, type, convert) {
			multi.hset(this.key, this.docId, JSON.stringify(this.oldDoc));
		}
	},

	// Doc delete functions
	remove: {

		/**
		 * Deletes an existing document
		 * @param  {RedisMulti} multi
		 * @param  {String} name The name of the property
		 * @param  {String} type The resourceful type of the property
		 * @param  {Function} convert An optional convert function
		 * @return {RedisMulti}
		 */
		execute: function deleteIndex(multi, name, type, convert) {
			multi.hdel(this.key, this.docId);
		},

		/**
		 * Rolls back a previously executed document delete
		 * @param  {RedisMulti} multi
		 * @param  {String} name The name of the property
		 * @param  {String} type The resourceful type of the property
		 * @param  {Function} convert An optional convert function
		 * @return {RedisMulti}
		 */
		rollback: function rollbackDeleteIndex(multi, name, type, convert) {
			multi.hset(this.key, this.docId, JSON.stringify(this.oldDoc));
		}
	}
};

// register command in command builder
commandBuilder.registerCommand(command);