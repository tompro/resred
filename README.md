resred
==========

Resred is a Redis backend for [flatiron/resourceful](https://github.com/flatiron/resourceful), and yes I am aware that there are other Redis backends like [resourceful-redis](https://github.com/particlebanana/resourceful-redis) which by the way gave me a quick start for developing Resred. Resred alredy uses the 3.0 version (especially the new id system) of resourceful. So you have to wait for a while before you can install this via npm.

### Why another backend?
Redis has a lot of features that can be used to optimize object access (you can build your own indexes, sorted sets and so on), and Redred is an attempt to make it very easy to use those additional features.

### Storage
The basic CRUD functionality is already implemented, and your resources are stored in Redis hash keys (I think of them as buckets). Every entry is stored as a JSON serialized string. Example:

```javascript

var Resource = resourceful.define("myresource", function(){
	this.use("resred", { uri: "localhost:6379"});
	this.string("id");
	this.string("myindex");
});

var resource = new Resource({
	myindex: "somestring"
});

resource.save(function(err, res){
	// resource.id == "my id" -> id is generated by resourceful
});

// Redis structure now looks like this
var redis = {
	"myresource" {
		"my id": {"id":"myresource/my id", "myindex": "somestring"}
	}
}

```
There are several reasons for putting your entries in buckets. One of them is that you do not pollute the global key space as every resource type will only require one key for data storage. Another reason is that data can be stored much more efficiently (in terms of memory usage) in Redis hashes than in global keys (see section Use hashes when possible: [Memory optimization](http://redis.io/topics/memory-optimization)). Last but not least Resred should make it easy to store and maintain additional indexes of your data. Those will require additional keys in the global namespace.

### The commandBuilder
Maintaining indexes is not a completly trivial task. First you have to create your index when data is saved to Redis. If this data is updated, and one of your indexed values has changed, you have to make sure that your index is updated as well. When the data is deleted you have to make sure your indexes are all cleaned up.

That sound rather easy but there is more to it. What if a Redis operation went wrong and the data (or your index) has not been saved. I such a case you have to rollback all the indexes you have created for this document. You also may want to retry the save operation. 

All of this should be possible for multiple document values with one or more different indexes (which means different Redis operations) each. CommandBuilder should make it easy to register such command chains.

CommandBuilder knows 3 different types of operation:

 * create - a document is created
 * update - a document is updated
 * remove - a document is deleted

For every type of operation there are 3 functions that can be implemented (you don't have to but most likely you will need them all):

 * execute - register your index write/update/delete action here
 * validate - called after execute has finished
 * rollback - undo your index write/update/delete from execute

In addition to the command functions you also have to provide a command name. An example command would look someting like this:

```javascript

var sampleCommand = {
	name: "sample",
	create: {
		execute: function() {},
		rollback: function() {},
		validate: function() {}
	},
	update: {
		execute: function() {},
		rollback: function() {},
		validate: function() {}
	},
	remove: {
		execute: function() {},
		rollback: function() {},
		validate: function() {}
	}
}

```

#### Command Functions

All command functions have a predefined set of values that passed as arguments. The execute and rollback functions have the same arguments:

```javascript
function exampleCommand(multi, key, docId, newDoc, oldDoc, config) {
	
}
```
The fucntion arguments:
 * multi - A Redis multi instance where you can add your Redis commands.
 * key - The key (resourceful type) and prefix for the given document (eg.: myprefix/myresource/)
 * docId - The id of the document currently processed
 * newDoc - The currently processed document
 * oldDoc - The previous version of the document (only available on update)
 * config - A config object containing the property name and convert function

Keep in mind that you do not have all those params available in all commands. You wouldn't need a newDoc oldDoc pair if you are saving a new document or deleting one.
The config object contains the property name that your command is applied to. So if we have a command named "sample" your function is called for every document key (the property) that has a "sample" index applied. In addition to that an optional convert function can be applied to indexes. This will come in handy if we want a sorted index on a string for example (Redis needs integers for sorted sets). A example config could look like this:

```javascript
{
	propName: "myindex", 
	convert: function(val){
		return createIntSomehow(val);
	}
}
```