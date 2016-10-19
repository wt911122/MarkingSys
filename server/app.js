var http = require("http");
var websocket = require("./websocket").websocket;
const path = require("path");
const mongodao = require("./mongoDao")
const rootPath = path.dirname(process.env.PWD);
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
	REQUEST_FILE_LIST: 1,
	REQUEST_A_PHOTO: 2,
	REQUEST_TO_SAVE_DATA: 3,
}

/*websocket.listen(10086, "localhost", function(connection){
	
	connection.on("data", function(opcode, data){
		console.log("message opcode: "+ opcode + "，data:" + data)
		conn.send(data);
	});
	connection.on("close", function(code, data){
		console.log("connection closed: ", code, reason);
	})
})*/

var server = http.createServer(function(request, response){
	console.log("createServer callback");
	var url = require("url").parse(request.url);
	switch(url.pathname){
		case "/":
			connect(request, response);
			break
		default:
			checkPath(url, response);
			break;
	}
});
server.on("upgrade", function(req, socket, upgradeHead){
	var ws = new websocket(req, socket, upgradeHead);
	connectionHandler(ws);
});
server.listen(10086, "localhost");
function connectionHandler(conn){
	conn.on("data", function(opcode, data){
		console.log("message opcode: "+ opcode + "，data:" + data)
		parseProtocol(opcode, data, conn);
	});
	conn.on("close", function(code, data){
		console.log("connection closed: ", code, data);
	})
}
/**
	自定义协议解析
**/
function parseProtocol(opcode, data, conn){
	if(opcode == OPCODE.TEXT){
		data = JSON.parse(data);
		switch(data.protocol){
			case PROTOCOL_TRANS.REQUEST_FILE_LIST:
				FileListRequestHandler(conn, data.protocol)
				break;
			case PROTOCOL_TRANS.REQUEST_A_PHOTO:
				PhotoRequestHandler(conn, data);
				break;
			case PROTOCOL_TRANS.REQUEST_TO_SAVE_DATA:
				DataSavingRequestHandler(conn, data);
				break;
		}
	}
}
/**
	文件列表获取请求处理
**/
function FileListRequestHandler(conn, prot){
	var list = {
		protocol: prot,
		filelist: [],
		markedfilelist: {}
	};
	var sourcePath = '../source/'
	fs.readdir(sourcePath, function(err, data){
		data.forEach(function(string){
			var path = sourcePath + string;
			var stat = fs.statSync(path);
			if(stat.size > 10000){
				list.filelist.push({
					title: string,
					path: path 
				});
			}
		});

		mongodao.findAll(function(records){
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
	var imagePath = path.join(process.env.PWD, data.path);
	mongodao.select(data, function(record){
		if(record){
			var obj = {
				protocol: PROTOCOL_TRANS.REQUEST_A_PHOTO,
				name: record.name,
				boxes: record.boxes
			}
			conn.send(JSON.stringify(obj));
		}
	});
	
}

function DataSavingRequestHandler(conn, data){
	delete data.protocol;
	console.log("data to save: "+JSON.stringify(data));
	mongodao.save(data, function(result){
		console.log("handled data:"+result);
		var data = {
			protocol: PROTOCOL_TRANS.REQUEST_TO_SAVE_DATA,
			data: result
		}
		conn.send(JSON.stringify(data));
	});
}

function connect(req, res){

	res.setHeader('Content-Type', 'text/html');
	
	//console.log(req);
	fs.readFile('../index.html',function(err, data){

		var body = data;
		res.writeHeader(200, {
			'Content-Length': Buffer.byteLength(body),
			'Content-Type': 'text/html' 
		})
		res.end(body);
	})
}
function checkPath(url, res){
	
	console.log("read photo")
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