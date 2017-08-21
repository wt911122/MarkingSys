const fs = require('fs');
const mongodao = require("./mongoDao");
const os = require("os");
const path = require("path");
var easyimg = require('easyimage');
const rootPath = path.dirname(process.env.PWD);
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
function checkRange(x, y, blocksize, width, height, range){
	return range.reduce(function(prev, next){

		return prev && !(x > next.xmin -blocksize && y > next.ymin - blocksize && x < next.xmax && y <next.ymax)  && (x < width-blocksize-1) && (y < height-blocksize-1);
	}, true)
}

mongodao.findAll(function(records){
	//console.log(records);
	let count = 0;
	let count_neg = 1133;
	records.forEach(function(doc){
		try{
			let im_path = `${rootPath}/source/clipimg/left/${doc.name}`
			//console.log(im_path);
			easyimg.info(im_path).then(
				function(file) {
					let width = file.width;
					let height = file.height;
					let range = [];
					doc.boxes.forEach(function(box){
						//console.log(box);
						//console.log(file);
						range.push({
							xmin: box.x - 25 ,
							xmax: box.x + box.width+1,
							ymin: box.y - 25,
							ymax: box.y + box.height+1
						})
						/*easyimg.rescrop({
							src: file.path, dst:`${rootPath}/source/output/${count++}.jpg`,
							width: width, height:height,
							cropwidth: Math.round(parseFloat(box.width)), cropheight:Math.round(parseFloat(box.height)),
							x:Math.round(parseFloat(box.x)), y:Math.round(parseFloat(box.y)),
							gravity: "NorthWest"
						}).then(
							function(image) {
								console.log('Resized and cropped: ' + image.width + ' x ' + image.height);
							},
							function (err) {
								console.log(err);
						});*/
					});
					//for(let i = 0; i < 3; i++){
						let x, y;
						do{
							x =  Math.round(Math.random() * width);
							y =  Math.round(Math.random() * height);
						}while(!checkRange(x, y, 25, width, height, range));

					
						easyimg.rescrop({
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
						});
					//}
					
					
				}, function (err) {
					console.log(err);
			});

		}catch(e){
			console.log(e);
		}
	});
});