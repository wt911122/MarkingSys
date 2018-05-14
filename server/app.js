var http = require("http");
var websocket = require("./websocket").websocket;
const path = require("path");
const {	
	tagDao,
	objectsDao,
	samplesDao,
	schemasDao,
} = require("./mongoDao");
const {	
	CropAndZip,
	RecordAndZip,
	RecordAllToTextAndZip
} = require('./app-chop2');


const rootPath = path.dirname(process.cwd());
const url = 'mongodb://localhost:27017/groundtruth';


var fs = require('fs');
var OPCODE = {
	TEXT: 1,
	BINARY: 2,
	CLOSE: 8,
	PING: 9,
	PONG: 10
}
var PROTOCOL_TRANS = {
	REQUEST_FOLDER_LIST: 0,
	REQUEST_FILE_LIST: 1,
	REQUEST_A_PHOTO: 2,
	REQUEST_TO_SAVE_DATA: 3,
	REQUEST_TAG_LIST: 4,
	REQUEST_OBJECT_LIST: 5,

	REQUEST_TO_SAVE_SCHEMA: 7,
}
var conns = [];

/*websocket.listen(10086, "localhost", function(connection){
	
	connection.on("data", function(opcode, data){
		console.log("message opcode: "+ opcode + "，data:" + data)
		conn.send(data);
	});
	connection.on("close", function(code, data){
		console.log("connection closed: ", code, reason);
	})
})*/
var TAGS = [];

var server = http.createServer(function(request, response){
	// console.log("createServer callback");
	var url = require("url").parse(request.url);
	switch(url.pathname){
		case "/":
			connect(request, response);
			break;
		case "/download":
			download(url, response);
			break;
		default:
			checkPath(url, response);
			break;
	}
});
server.on("upgrade", function(req, socket, upgradeHead){
	var ws = new websocket(req, socket, upgradeHead);
	connectionHandler(ws);
	conns.push(ws);
});
server.listen(10086);
function connectionHandler(conn){
	conn.on("data", function(opcode, data){
		console.log("message opcode: "+ opcode + "，data:" + data)
		parseProtocol(opcode, data, conn);
	});
	conn.on("close", function(code, data){
		console.log("connection closed: ", code, data);
		var idx = conns.indexOf(conn);
		//console.log(idx);
		conns.splice(idx, 1);
	})
}
/**
	自定义协议解析
**/
function parseProtocol(opcode, data, conn){
	if(opcode == OPCODE.TEXT){
		data = JSON.parse(data);
		switch(data.protocol){
			case PROTOCOL_TRANS.REQUEST_TAG_LIST:
				TagListRequestHandler(conn);
				break;
			case PROTOCOL_TRANS.REQUEST_FOLDER_LIST:
				FolderListRequestHandler(conn, data.protocol);
				break;
			case PROTOCOL_TRANS.REQUEST_FILE_LIST:
				FileListRequestHandler(conn, data)
				break;
			case PROTOCOL_TRANS.REQUEST_A_PHOTO:
				PhotoRequestHandler(conn, data);
				break;
			case PROTOCOL_TRANS.REQUEST_TO_SAVE_DATA:
				DataSavingRequestHandler(conn, data);
				break;
			case PROTOCOL_TRANS.REQUEST_TO_SAVE_SCHEMA:
				SchemaSavingRequestHandler(conn, data);
				break;
		}
	}
}
function TagListRequestHandler(conn){
	tagDao.findAll({}, (data) => {
		TAGS = data.map((item) => {
			const objectPro = new Promise((resolve, reject) => {
				objectsDao.findAll({tag: item.tag}, (data) => {
					const list = data.map((item) => ({
						object: item.object, 
						tag: item.tag,
						color: item.color,
					}));
					resolve({
						objects: list,
					})
				});
			});
			const schemaPro = new Promise((resolve, reject) => {
				schemasDao.findAll({tag: item.tag}, (data) =>{
					const list = data.map((item) => ({
						schema: item.schema, 
						tag: item.tag,
						brief: item.brief,
						time: item.time,
					}));
					resolve({
						schemas: list,
					})
				});
			});			
			return Promise.all([objectPro, schemaPro]).then((arr) => {
				return Object.assign({
					tag: item.tag,
					width: item.width,
					height: item.height,
				}, arr[0], arr[1]);
			}) 
		});
		Promise.all(TAGS)
		.then((arr) => {
			//console.log(arr)
			conn.send(JSON.stringify({
				protocol: PROTOCOL_TRANS.REQUEST_TAG_LIST,
				tagList: arr,
			}));
		})
	});
}

function ObjectListRequestHandler(conn, tag){
	let which = TAGS[0];
	if(tag){
		which = tag;
	}
	objectsDao.findAll({tag: which}, (data) => {
		const list = data.map((item) => ({
			object: item.object, 
			tag: item.tag,
			color: item.color,
		}));
		conn.send(JSON.stringify(list))
	});
}
/**
	文件夹列表获取
**/
function FolderListRequestHandler(conn, prot){
	var list = {
		protocol: prot,
		folderList: [],
	};
	var sourcePath = '../source/'
	fs.readdir(sourcePath, function(err, data){
		data.forEach(function(string){
			var path = sourcePath + string;
			var stat = fs.statSync(path);
			console.log(stat);
			if(string !== ".DS_Store" && stat.size > 1000){
				list.folderList.push({
					title: string,
					path: path 
				});
			}
		});
		conn.send(JSON.stringify(list));
	});
}

/**
	文件列表获取请求处理
**/
function FileListRequestHandler(conn, data){
	var list = {
		protocol: data.protocol,
		filelist: [],
		markedfilelist: {}
	};
	var sourcePath = '';
	var folder = '';
	var tag = '';
	var schema = '';
	if(data.folder){
		sourcePath = `${data.folder}/`;
		folder = `${path.basename(data.folder)}`;
		tag = data.tag;
		schema = data.schema;
	}
	console.log(sourcePath);
	fs.readdir(sourcePath, function(err, data){
		console.log(data);
		data.forEach(function(string){
			var path = sourcePath + string;
			var stat = fs.statSync(path);
			if(string !== ".DS_Store" && stat.size > 1000){
				list.filelist.push({
					title: string,
					path: path 
				});
			}
		});
		console.log(folder, tag, schema);
		samplesDao.findAll({
			folder: folder,
			tag: tag,
			schema: schema,
		}, function(records){
			records.forEach(function(item){
				Object.defineProperty(list.markedfilelist, item.name, {
					enumerable: true,
					value: item.name
				});
			})
			conn.send(JSON.stringify(list));
		});
		
	});	
}
/**
	图片请求处理
**/
function PhotoRequestHandler(conn, data){
	var imagePath = path.join(process.cwd(), data.path);
	var folder  = `${path.basename(data.folder)}`;
	console.log(data);
	objectsDao.findAll({
		tag: data.tag,
	}, (objs) => {
		function filter(obj){
			return objs.find((item) => (item.object === obj))
		}
		console.log(objs);
		samplesDao.findAll({
			folder: folder,
			tag: data.tag,
			schema: data.schema,
			path: data.path,
		}, function(records){
			console.log(records);
			if(records.length > 0){
				var boxes = records.map((r) => ({
					name: r.name,
			    folder: r.folder,
			    path: r.path,
			    tag: r.tag,
			    type: filter(r.type),
			    x: r.x,
			    y: r.y,
			    width: r.width,
			    height: r.height
				}));
				console.log(boxes);
				conn.send(JSON.stringify({
					protocol: data.protocol,
					boxes: boxes,
				}));
			}
		});
	});
}

function DataSavingRequestHandler(conn, data){
	delete data.protocol;
	console.log("data to save: "+JSON.stringify(data));
	var folder  = `${path.basename(path.dirname(data.path))}`;
	//console.log(folder);
	const filter = {
		name: data.name,
		folder: folder,
		path: data.path,
		tag: data.tag,
		schema: data.schema,
	}
	const records = data.boxes.map((box) => (Object.assign({}, {
		name: data.name,
		folder: folder,
		path: data.path,	
		schema: data.schema,
	}, box)));

	console.log(records)
	samplesDao.save(filter, records, function(result){
		console.log("handled data:", result);
		if(result === 'empty'){
			var msg = {
				protocol: PROTOCOL_TRANS.REQUEST_TO_SAVE_DATA,
				data: {
					name: data.name,
					folder: path.dirname(data.path),
					empty: true,
				}
			}
		}else{
			var msg = {
				protocol: PROTOCOL_TRANS.REQUEST_TO_SAVE_DATA,
				data: {
					name: data.name,
					folder: path.dirname(data.path),
				}
			}
		}
		
		//conn.send(JSON.stringify(data));
		conns.forEach(function(conn){
			conn.send(JSON.stringify(msg));
		})
	});
}

function SchemaSavingRequestHandler(conn, data){
	console.log(data);
	var dt = data.data;
	var record = Object.assign({},
		dt,
		{time: new Date()});
	console.log(record);
	if(dt.base){
		samplesDao.findAll({
			tag: record.tag,
			schema: record.base,
		}, (records) => {
			var copy = records.map((rec) => ({
				name: rec.name,
		    folder: rec.folder,
		    path: rec.path,
		    schema: record.schema,
		    tag: rec.tag,
		    type: rec.type,
		    x: rec.x,
		    y: rec.y,
		    width: rec.width,
		    height: rec.height
			}));
			samplesDao.save({
				tag: record.tag,
				schema: record.schema,
			}, copy, (result) => {
				console.log("handled data:", result);
				/*if(result === 'empty'){
					var msg = {
						protocol: PROTOCOL_TRANS.REQUEST_TO_SAVE_DATA,
						data: {
							name: data.name,
							folder: path.dirname(data.path),
							empty: true,
						}
					}
				}else{
					var msg = {
						protocol: PROTOCOL_TRANS.REQUEST_TO_SAVE_DATA,
						data: {
							name: data.name,
							folder: path.dirname(data.path),
						}
					}
				}*/
			})
		})
	}
	schemasDao.save(record, (res) => {

		if(res.result.ok){
			conn.send(JSON.stringify({
				protocol: data.protocol,
				ok: 1,
			}));
		}else{
			conn.send(JSON.stringify({
				protocol: data.protocol,
				ok: 0,
			}));
		}
	});
}

function connect(req, res){

	res.setHeader('Content-Type', 'text/html');
	
	//console.log(req);
	fs.readFile('../index.html',function(err, data){
		console.log(err)
		var body = data;
		res.writeHeader(200, {
			'Content-Length': Buffer.byteLength(body),
			'Content-Type': 'text/html' 
		})
		res.end(body);
	})
}
function checkPath(url, res){
	
	// console.log("read photo")
	if(/\.jpg$/.test(url.pathname)){
		//var currentPath = process.cwd();
		var imagePath = path.join(rootPath, url.pathname);
	//	console.log(imagePath);
		var stat = fs.statSync(imagePath);
	//	console.log(stat);
		const rr = fs.createReadStream(imagePath);

		res.writeHead(200, {
	        'Content-Type': 'image/jpeg',
	        'Content-Length': stat.size
	    });
		rr.pipe(res);
		rr.on('finish', function(){
			console.log("image read end");
			fs.close();
		})
	}else if(/\.png$/.test(url.pathname)){

		var imagePath = path.join(rootPath, url.pathname);
	//	console.log(imagePath);
		var stat = fs.statSync(imagePath);
	//	console.log(stat);
		const rr = fs.createReadStream(imagePath);

		res.writeHead(200, {
	        'Content-Type': 'image/png',
	        'Content-Length': stat.size
	    });
		rr.pipe(res);
		rr.on('finish', function(){
			console.log("image read end");
			fs.close();
		})
	}else if(/\.css$/.test(url.pathname) || /\.js$/.test(url.pathname)){

	//	var currentPath = process.cwd();
		var cssPath = path.join(rootPath, url.pathname);
		console.log(cssPath);
		var stat = fs.statSync(cssPath);

		const rr = fs.createReadStream(cssPath);
		res.writeHead(200, {
	        'Content-Type': 'text/css',
	        'Content-Length': stat.size
	    });
		rr.pipe(res);
	}else{
		res.end("error uri");
	}

}

function download(url, res){
	console.log(url);
	const query = {};
	url.query.split("&").forEach((kv) => {
		const arr = /([^=]+)=([^=]+)/.exec(kv);
		query[arr[1]] = decodeURI(arr[2]);
	});
	query.folder = path.basename(query.folder);
	query.objects = query.objects.split(";");

	const filter = {
		folder: query.folder,
		tag: query.tag,
		schema: query.schema,
		type: {$in: query.objects},
	}
	function transportZIP(path){
		if(!path){
			return;
		}
		console.log(`${path} zipped`);
		var stat = fs.statSync(path);
		//console.log(stat);
		const rr = fs.createReadStream(path);
		res.writeHead(200, {
		    'Content-Type': 'application/octet-stream',
		    'Content-Length': stat.size
		});
		rr.pipe(res);
		rr.on('close', function(){
			console.log("zip translate end");
			var stat = fs.statSync(path);
			console.log(stat)
			fs.unlink(path, function(err) {
			  if (err) throw err;
			  console.log('文件删除成功');
			});
		})
	}
	console.log(filter);
	switch(query.form){
		case 'text':
			RecordAndZip(filter, transportZIP)
		break;
		case 'zip':
			CropAndZip(filter, transportZIP)
		break;
		case 'onetxteachpic':
			RecordAllToTextAndZip(transportZIP)
	}
	/*CropAndZip(query, function(path){
		console.log(`${path} zipped`);
		var stat = fs.statSync(path);
	  //console.log(stat);
		const rr = fs.createReadStream(path);
		res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': stat.size
    });
		rr.pipe(res);
		rr.on('close', function(){
			console.log("zip translate end");
			var stat = fs.statSync(path);
			console.log(stat)
			fs.unlink(path, function(err) {
			  if (err) throw err;
			  console.log('文件删除成功');
			});
		})
	});*/
}


