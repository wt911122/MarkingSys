const assert = require("assert");
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017/groundtruth';
const COLLECTION = 'sample1'

var MongoDao = {

	save: function(data, callback){
		MongoClient.connect(url, function(err, db) {
			assert.equal(null, err);
			var col = db.collection(COLLECTION);
			col.findOneAndUpdate(
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
			);
		});
	},
	findAll: function(callback){
		MongoClient.connect(url, function(err, db) {
			assert.equal(null, err);
			var col = db.collection(COLLECTION);
			col.find().toArray(function(err, docs){
				assert.equal(null, err);
				db.close();
				callback(docs);
			})
		});
	},
	select: function(data, callback){
		console.log(data.title);
		MongoClient.connect(url, function(err, db) {
			assert.equal(null, err);
			var col = db.collection(COLLECTION);
			col.findOne({name: data.title}, {}, function(err, docs){
				assert.equal(null, err);
				db.close();
				//console.log(docs);
				callback(docs);
			});
		});
	}
}
module.exports = MongoDao;