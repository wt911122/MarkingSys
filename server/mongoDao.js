const assert = require("assert");
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017/zjutdb';
const COLLECTION = 'samples';

var MongoDao = {
	findAll: function(filteroptions = {}, callback){
		var self = this;
		MongoClient.connect(url, function(err, db) {
			assert.equal(null, err);
			var col = db.collection(self.collection);
			col.find(filteroptions).toArray(function(err, docs){
				assert.equal(null, err);
				db.close();
				callback(docs);
			})
		});
	},
	select: function(filteroptions = {}, callback){
		var self = this;
		MongoClient.connect(url, function(err, db) {
			assert.equal(null, err);
			var col = db.collection(self.collection);
			col.findOne(filteroptions, {}, function(err, docs){
				assert.equal(null, err);
				db.close();
				//console.log(docs);
				callback(docs);
			});
		});
	}
}

var tagDao = Object.create(MongoDao);
tagDao.collection = "tags";

var objectsDao = Object.create(MongoDao);
objectsDao.collection = "objects";

var schemasDao = Object.create(MongoDao);
schemasDao.collection = "schemas";

schemasDao.save = function(data, callback) {
	var self = this;
	MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		var col = db.collection(self.collection);
 		col.insertOne(data).then(callback);
	});
}


var samplesDao = Object.create(MongoDao);
samplesDao.collection = "samples";

samplesDao.save = function(filter, data, callback){
	var self = this;
	MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		var col = db.collection(self.collection);
		col.deleteMany(filter).then((result)=>{
			if(data.length > 0){
				return col.insertMany(data)
			}else{
				return 'empty';
			}
		}).then(callback);
		/*col.findOneAndUpdate(
			{name: data.name},
			{$set: {boxes: data.boxes}},
			{
				upsert: true,
				returnOriginal:false
			},
			function(err, result){
				assert.equal(null, err);
				db.close();
				console.log(JSON.stringify(result));
				callback({
					name: result.value.name,
					boxes: result.value.boxes
				});
			}
		);*/
	});
}

var DefaultDao = function(collect){
	return new Promise((resolve, reject) => {
		MongoClient.connect(url, function(err, db){
			assert.equal(null, err);
			var col= db.collection(collect);
			resolve(col);
		})
	});
	
}


module.exports = {
	tagDao,
	objectsDao,
	samplesDao,
	schemasDao,
	DefaultDao
}