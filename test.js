var resourceful = require("resourceful"),
	redis = require("redis"),
	resred = require("./resred")
	redisConnection = redis.createClient();

var Creature = resourceful.define("creature", function(){

	this.use('resred', {
		connection: redisConnection,
		index: {
			"diet": ["unique"],
			"age": ["sort"]
		}
	});

});
Creature.string("diet", {
	redis: ["index", "unique", "sort"],
	required: true
});
Creature.bool("male");
Creature.number("age");

var wolf = new Creature({diet: "meat", male: true, age: 35});

Creature.get(14, function(err, wolf){
	console.log(err);
	console.log(wolf);
});