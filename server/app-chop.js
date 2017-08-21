const fs = require('fs');
const mongodao = require("./mongoDao");
const os = require("os");

var output = fs.createWriteStream("./output.txt");

mongodao.findAll(function(records){
	//console.log(records);
	records.forEach(function(doc){
		try{
			delete doc._id
			//console.log(typeof doc)
			output.write(JSON.stringify(doc) + os.EOL);
		}catch(e){
			console.log(e);
		}
	});
})