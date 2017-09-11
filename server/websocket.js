var crypto = require('crypto');
var util = require("util");
var events = require('events');


var OPCODE = {
	TEXT: 1,
	BINARY: 2,
	CLOSE: 8,
	PING: 9,
	PONG: 10
}

var websocketConnection = function(req, socket, upgradeHead){
	var self = this;
	console.log(`request ${req.headers["sec-websocket-protocol"]} ${req.headers["sec-websocket-key"]}`)
	console.log(req.headers["sec-websocket-protocol"]);
	var key = computeKey(req.headers["sec-websocket-key"]);
	socket.write(
		'HTTP/1.1 101 Web Socket Protocol Handshake\r\n' + 
		"Upgrade: WebSocket\r\n" + 
		"Connection: Upgrade\r\n" +
		//"sec-websocket-protocol:" + req.headers["sec-websocket-protocol"] + "\r\n" + 
		"sec-websocket-accept:" + key + '\r\n\r\n');
	socket.on('data', function(buf){
		self.buffer = Buffer.concat([self.buffer, buf]);
		while(self._processBuffer()){
			console.log("process buffer while it contains complete frames")
		}
	});
	socket.on('close', function(had_error){
		if(!self.closed){
			self.emit("close", 1006);
			self.closed = true;
		}
	})
	this.socket = socket;
	this.buffer = new Buffer(0);
	this.closed = false;
}
util.inherits(websocketConnection, events.EventEmitter)

websocketConnection.prototype.send = function(obj){
	var opcode;
	var payload;
	if(Buffer.isBuffer(obj)){
		opcode = OPCODE.BINARY;
		payload = obj;
	}else if(typeof obj == "string"){
		//console.log("send:" + obj);
		opcode = OPCODE.TEXT;
		payload = new Buffer(obj, 'utf8');
	}else{
		throw new Error("cannot send object. Must be String or Buffer");
	}
	this._doSend(opcode, payload);
}

websocketConnection.prototype._processBuffer = function(){
	var buf = this.buffer;
	if(buf.length < 2){
		return;
	}
	var idx = 2;
	var bit = buf.readUInt8(0);
	var isfragment = bit & 0x80;
	var opcode = bit & 0x0f;

	var bit2 = buf.readUInt8(1);
	var ismask = bit2 & 0x80;
	var length = bit2 & 0x7f;

	if(length > 125){
		if(buf.length < 8){
			return;
		}
	}

	if(length == 126){
		// 跳过之前2byte读2byte
		length = buf.readUInt16BE(2);
		idx += 2;	
	}else if(length == 127){
		// 跳过之前2byte读4byte
		var highBits = buf.readUInt32BE(2);
		if(highBits != 0){
			// 规定 4 byte长度的frame太大了
			this.close(1009, "too large frame");
		}
		// 跳过之前6byte读4byte
		length = buf.readUInt32BE(6)
		idx += 8;
	}

	// 校验长度和
	if(length + 4 + idx > buf.length){
		console.log("长度和错误");
		return 
	}

	// 计算mask与data异或
	var mask = buf.slice(idx, idx + 4);
	idx += 4;
	var payload = unmask(mask, buf.slice(idx, idx+length));
	this._handleFrame(opcode, payload);
	this.buffer = buf.slice(idx+length);
	return true;
}

websocketConnection.prototype.close = function(code, message){
	var opcode = OPCODE.CLOSE;
	var buffer;

	if(code){
		buffer = new Buffer(Buffer.byteLength(message) + 2);
		buffer.writeUInt16BE(code, 0);
		buffer.write(message);
	}else{
		buffer = new Buffer(0);
	}
	this._doSend(opcode, buffer);
	this.closed = true;
}

websocketConnection.prototype._handleFrame = function(opcode, buffer){
	switch(opcode){
		case OPCODE.TEXT:
			payload = buffer.toString("utf8");
			this.emit("data", opcode, payload);
			break;
		case OPCODE.BINARY:
			payload = buffer;
			this.emit("data", opcode, payload);
			break;
		case OPCODE.CLOSE:
			var code, reason;
			if(buffer.length >= 2){
				code = buffer.readUInt16BE(0);
				reason = buffer.toString("utf8", 2);
			}
			this.close(code, reason);
			this.emit("close", code, reason);
			break;
		case OPCODE.PING:
			this._doSend(OPCODE.PONG, buffer);
			break;
		case OPCODE.PONG:
			break;
		default: 
			this.close(1002, "unknown opcode");
	}
}
websocketConnection.prototype._doSend = function(opcode, payload){
	this.socket.write(encodeMessage(opcode, payload));
}

function encodeMessage(opcode, payload){
	var buf;
	var b1 = 0x80 | opcode;
	var b2 = 0;
	var length = payload.length;
	if(length < 126){
		buf = new Buffer(payload.length + 2 + 0);
		b2 |= length;
		buf.writeUInt8(b1, 0);
		buf.writeUInt8(b2, 1);
		payload.copy(buf, 2);
	}else if(length < (1<<16)){
		buf = new Buffer(payload.length + 2 + 2);
		b2 |= 126;
		buf.writeUInt8(b1, 0);
		buf.writeUInt8(b2, 1);
		buf.writeUInt16BE(length, 2);
		payload.copy(buf, 4);
	}else{
		buf = new Buffer(payload.length + 2 + 8);
		b2 |= 127;
		buf.writeUInt8(b1, 0);
		buf.writeUInt8(b2, 1);
		buf.writeUInt32BE(0, 2);
		buf.writeUInt32BE(length, 6);
		payload.copy(buf, 10);
	}
	return buf;
}

function unmask(mask_byte, buffer){
	var payload = new Buffer(buffer.length);
	for(var i=0; i<buffer.length; i++){
		// mask 4 byte
		payload[i] = mask_byte[i%4] ^ buffer[i]
	}
	return payload;
}
//UGXst0TqW1WbisMRgUfJ+Q==258EAFA5-E914-47DA-95CA-C5AB0DC85B11
function computeKey(key){
	var KEY_SUFFIX = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
	var sha1 = crypto.createHash("sha1");
	sha1.update(key+KEY_SUFFIX, "ascii");
	return sha1.digest("base64");
}

exports.websocket = websocketConnection;

