var app = this.app || {};

(function(app){
	var firstInit = true;
	app.websocket = (function(){
		var ws;
		var Event = {
			webSocketDidOpen: "webSocketDidOpen",
			messageReceived: {
				blob: "blob",
				string: "string"
			},
			error: "error"
		};
		function log(msg){
			console.log(msg);
		} 
		function wrapper(wsUrl){
			this.wsUrl = wsUrl;
			console.log(this);
			this.init();
			//return this;
		}
		
		wrapper.prototype = Object.create(app.Event);
		wrapper.prototype.init = function(callback){
			ws = new WebSocket(this.wsUrl);
			var self = this;
			ws.onopen = function(e){
				log("connected at: ");

				var eventobj = self.createEvent(Event.webSocketDidOpen, {
					data: e,
					conn: ws
				});
				if(firstInit)
					self.emit(Event.webSocketDidOpen, eventobj)
				firstInit = false;
				if(callback) callback();
			}
			ws.onmessage = function(e){
				log("message came at: ");
				if(typeof e.data === "string"){
					console.log(e.data);
					var eventobj = self.createEvent(Event.messageReceived.string, {
						data: JSON.parse(e.data),
						conn: ws
					});
					self.emit(Event.messageReceived.string, eventobj)
				}

				if(e.data instanceof Blob){
					var eventobj = self.createEvent(Event.messageReceived.blob, {
						data: e.data,
						conn: ws
					});
					self.emit(Event.messageReceived.blob, eventobj)
				}

							}
			ws.onerror = function(e){
				log("Error");
				var eventobj = self.createEvent(Event.error, {
					data: e.data,
					conn: ws
				});
				self.emit(Event.error, eventobj)
			}
			ws.onclose = function(e){
				log("websocket closed");
			}
		}
		wrapper.prototype.send = function(data){
			if(ws.readyState !== 1){
				this.init(function(){
					ws.send(data);
				});
			}else{
				ws.send(data);
			}
			
		}
		/**
			package{
				EventName: String
				request: function: return request data, string or array or blob,
				event: function: parameter: data received, return event obj
				response: function 
			}
		
		wrapper.prototype.addStringMessageReceivedPackage = function(package){
			
		}**/

		return {
			init: function(url){
				app.websocket = new wrapper(url);
				app.websocket.Event = Event;
			}
		}
	}());
}).call(window, app);