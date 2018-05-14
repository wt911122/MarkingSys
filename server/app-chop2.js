const fs = require('fs');
const { samplesDao, DefaultDao } = require("./mongoDao");
const os = require("os");
const path = require("path");
const easyimg = require('easyimage');
const archiver = require('archiver');
const rootPath = path.dirname(process.cwd());
/*var imginfo = { type: 'jpeg',
  depth: 8,
  width: 248,
  height: 80,
  size: 5800,
  density: { x: 72, y: 72 },
  name: '216.jpg',
  path: '/Users/TonyWang/documents/my workspaces/markingsys/source/clipimg/left/216.jpg' }

var lock1 = { type: 'frontlock',
  x: 18.610634648370496,
  y: 34.34991423670669,
  width: 21.9073756432247,
  height: 21.9073756432247 };

var lock2 = { type: 'frontlock',
  x: 210.88507718696397,
  y: 32.6483704974271,
  width: 21.9073756432247,
  height: 21.9073756432247 }
var count = 0
easyimg.crop({
	src: imginfo.path, dst:`${rootPath}/source/output/${count++}.jpg`,
	cropwidth: Math.round(parseFloat(lock1.width)), 
	cropheight:Math.round(parseFloat(lock1.height)),
	x:Math.round(parseFloat(lock1.x)), 
	y:Math.round(parseFloat(lock1.y)),
	gravity: "NorthWest"
}).then(
	function(image) {
		console.log('Resized and cropped: ' + image.width + ' x ' + image.height);
	},
	function (err) {
		console.log(err);
});
easyimg.crop({
	src: imginfo.path, dst:`${rootPath}/source/output/${count++}.jpg`,
	cropwidth: Math.round(parseFloat(lock2.width)), 
	cropheight:Math.round(parseFloat(lock2.height)),
	x:Math.round(parseFloat(lock2.x)), 
	y:Math.round(parseFloat(lock2.y)),
	gravity: "NorthWest"
}).then(
	function(image) {
		console.log('Resized and cropped: ' + image.width + ' x ' + image.height);
	},
	function (err) {
		console.log(err);
});
*/


 
// pipe archive data to the file 


function checkRange(x, y, blocksize, width, height, range){
	return range.reduce(function(prev, next){

		return prev && !(x > next.xmin -blocksize && y > next.ymin - blocksize && x < next.xmax && y <next.ymax)  && (x < width-blocksize-1) && (y < height-blocksize-1);
	}, true)
}
function deleteall(path) {  
    var files = [];  
    if(fs.existsSync(path)) {  
        files = fs.readdirSync(path);  
        files.forEach(function(file, index) {  
            var curPath = path + "/" + file;  
            if(fs.statSync(curPath).isDirectory()) { // recurse  
                deleteall(curPath);  
            } else { // delete file  
                fs.unlinkSync(curPath);  
            }  
        });  
        fs.rmdirSync(path);  
    }  
};
function CropAndZip(filter, callback){
	var base = Date.now();
	var path = `${rootPath}/temp/${base}-samples.zip`;
	var dstpath = `${rootPath}/temp/${base}`;
	var output = fs.createWriteStream(path);
	var archive = archiver('zip', {
	    zlib: { level: 9 } // Sets the compression level. 
	});
	output.on('close', function() {
	  console.log(archive.pointer() + ' total bytes');
	  console.log('archiver has been finalized and the output file descriptor has closed.');
	  deleteall(dstpath);
	  callback(path);
	});
	// good practice to catch warnings (ie stat failures and other non-blocking errors) 
	archive.on('warning', function(err) {
	  if (err.code === 'ENOENT') {
	      // log warning 
	  } else {
	      // throw error 
	      throw err;
	  }
	});
	 
	// good practice to catch this error explicitly 
	archive.on('error', function(err) {
	  throw err;
	});
	archive.pipe(output);
	samplesDao.findAll(filter, function(records){
		console.log(records);
		let count = 0;
		let count_neg = 1133;
		Promise.all(records.map(function(doc){
			let im_path = `${rootPath}/source/${doc.folder}/${doc.name}`;
			console.log(im_path);
			//console.log(im_path);
			return easyimg.info(im_path).then(
				function(file) {
					let width = file.width;
					let height = file.height;
					let range = [];
					return easyimg.rescrop({
						src: file.path, dst:`${dstpath}/${doc.type}/${count++}.jpg`,
						width: width, height:height,
						cropwidth: Math.round(parseFloat(doc.width)), cropheight:Math.round(parseFloat(doc.height)),
						x:Math.round(parseFloat(doc.x)), y:Math.round(parseFloat(doc.y)),
						gravity: "NorthWest"
					});
					/*return Promise.all(doc.boxes.map(function(box){
						//console.log(box);
						//console.log(file);
						range.push({
							xmin: box.x - 25 ,
							xmax: box.x + box.width+1,
							ymin: box.y - 25,
							ymax: box.y + box.height+1
						})
						return easyimg.rescrop({
							src: file.path, dst:`${rootPath}/source/output/${count++}.jpg`,
							width: width, height:height,
							cropwidth: Math.round(parseFloat(box.width)), cropheight:Math.round(parseFloat(box.height)),
							x:Math.round(parseFloat(box.x)), y:Math.round(parseFloat(box.y)),
							gravity: "NorthWest"
						});
					}));*/

				}, function (err) {
					console.log(err);
			})
		})).then(function(arr){
			if(arr.length > 0){
				return archive.directory(dstpath, 'samples').finalize();
			}else{
				callback(undefined); 
			}
			//console.log(`${rootPath}/source/output/`);
			
		})
	});
};

function RecordAndZip(filter, callback){
	var base = Date.now();
	var path = `${rootPath}/temp/${base}-samples.zip`;
	var dstpath = `${rootPath}/temp/${base}`;
	var output = fs.createWriteStream(path);
	var archive = archiver('zip', {
	    zlib: { level: 9 } // Sets the compression level. 
	});
	output.on('close', function() {
	  console.log(archive.pointer() + ' total bytes');
	  console.log('archiver has been finalized and the output file descriptor has closed.');
	  deleteall(dstpath);
	  callback(path);
	});
	// good practice to catch warnings (ie stat failures and other non-blocking errors) 
	archive.on('warning', function(err) {
	  if (err.code === 'ENOENT') {
	      // log warning 
	  } else {
	      // throw error 
	      throw err;
	  }
	});
	 
	// good practice to catch this error explicitly 
	archive.on('error', function(err) {
	  throw err;
	});
	archive.pipe(output);
	fs.mkdirSync(dstpath);
	samplesDao.findAll(filter, function(records){
		console.log(records);
		let count = 0;
		let count_neg = 1133;

		const results = {};

		records.forEach((doc) => {
			let type = results[doc.type];
			if(!type) type = '';
			const r = type + `${doc.name} ${doc.schema} ${doc.tag} ${doc.type} ${parseInt(doc.x)} ${parseInt(doc.y)} ${parseInt(doc.x+doc.width)} ${parseInt(doc.y + doc.height)}\r\n`
			results[doc.type] = r;
		});
		console.log(results);
		Promise.all(Object.keys(results).map((k) => {
			const text_path = `${dstpath}/${k}.txt`;
			return new Promise((resolve, reject) => {
				fs.writeFile(text_path, results[k], (err) => {
					if(err) {
						console.log(err);
						reject(err);
					}
					else resolve('ok');
				})
			})
		})).then(function(){
			//console.log(`${rootPath}/source/output/`);
			return archive.directory(dstpath, 'samples').finalize();
		}, (err) => {
			console.log(err);
		})
	});

}


function RecordAllToTextAndZip(callback){
	var base = Date.now();
	var path = `${rootPath}/temp/${base}-samples.zip`;
	var dstpath = `${rootPath}/temp/${base}`;
	var output = fs.createWriteStream(path);
	var archive = archiver('zip', {
	    zlib: { level: 9 } // Sets the compression level. 
	});
	output.on('close', function() {
	  console.log(archive.pointer() + ' total bytes');
	  console.log('archiver has been finalized and the output file descriptor has closed.');
	  deleteall(dstpath);
	  callback(path);
	});
	// good practice to catch warnings (ie stat failures and other non-blocking errors) 
	archive.on('warning', function(err) {
	  if (err.code === 'ENOENT') {
	      // log warning 
	  } else {
	      // throw error 
	      throw err;
	  }
	});

		// good practice to catch this error explicitly 
	archive.on('error', function(err) {
	  throw err;
	});
	archive.pipe(output);
	fs.mkdirSync(dstpath);

	//db.samples.aggregate([{$group: {_id:"$name", features:{$push:{type:"$type",x:"$x"}}}}])

	DefaultDao("samples")
		.then((collection) => {
				collection.aggregate(
					[
						{
							$group: {
								_id:"$name",
								features:{
									$push:{
										type:"$type",
										x:"$x",
										y:"$y",
										width:"$width",
										height:"$height",
									}
								}
							}
						}
					], function(err, result){

						Promise.all(result.map((k) => {
							//console.log(k);
							const text_path = `${dstpath}/${k._id}.txt`;
							const f = k.features;

							const content = f.map((c) => (`${c.type} ${c.x} ${c.y} ${c.width} ${c.height}`)).join('\r\n');
							return new Promise((resolve, reject) => {
								fs.writeFile(text_path, content, (err) => {
									if(err) {
										console.log(err);
										reject(err);
									}
									else resolve('ok');
								})
							})
						})).then(function(){
							//console.log(`${rootPath}/source/output/`);
							return archive.directory(dstpath, 'samples').finalize();
						}, (err) => {
							console.log(err);
						})
					});
		})
}
module.exports = {
	CropAndZip,
	RecordAndZip,
	RecordAllToTextAndZip
}

					//for(let i = 0; i < 3; i++){
					/*	let x, y;
						do{
							x =  Math.round(Math.random() * width);
							y =  Math.round(Math.random() * height);
						}while(!checkRange(x, y, 25, width, height, range));*/
					
						/*easyimg.rescrop({
							src: file.path, dst:`${rootPath}/source/negtive/${count_neg++}.jpg`,
							width: width, height:height,
							cropwidth: 25, cropheight:25,
							x:x , y:y,
							gravity: "NorthWest"
						}).then(
							function(image) {
								console.log('Resized and cropped: ' + image.width + ' x ' + image.height);
							},
							function (err) {
								console.log(err);
						});*/
					//}
					
					/*.then(
							function(image) {
								console.log('Resized and cropped: ' + image.width + ' x ' + image.height);
								return true;
							},
							function (err) {
								console.log(err);
								return false;
						});*/