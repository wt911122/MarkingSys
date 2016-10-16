var app = this.app || {};

(function(app){
	app.websocket = (function(){
		var ws;
		var Event = {
			webSocketDidOpen: "webSocketDidOpen",
			messageReceived: "messageReceived",
			error: "error"
		};
		function log(msg){
			console.log(msg);
		} 
		var wrapper = function(wsUrl){
			ws = new WebSocket(wsUrl);
			var self = this;
			ws.onopen = function(e){
				log("connected at: ");

				var eventobj = self.createEvent(Event.webSocketDidOpen, {
					data: e,
					conn: ws
				});
				self.emit(Event.webSocketDidOpen, eventobj)
			}
			ws.onmessage = function(e){
				log("message came at: ");
				var eventobj = self.createEvent(Event.messageReceived, {
					data: e.data,
					conn: ws
				});
				self.emit(Event.messageReceived, eventobj)
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
			//return this;
		}
		wrapper.prototype = Object.create(app.Event);
		wrapper.prototype.send = function(data){
			ws.send(data);
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