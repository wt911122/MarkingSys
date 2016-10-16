var app = this.app || {};

(function(app){
	app.Event = {
		_listeners: {},
		createEvent: function(EventName, configure){
			return Object.assign({
				EventName: EventName
			}, configure);
		},
		addEventListener: function(EventName, callback, context){
			var _listeners = this._listeners
			if(!context) context = window;
			if(!_listeners[EventName]) _listeners[EventName] = [];

			_listeners[EventName].push({
				callback: callback,
				context: context
			});
		},
		removeEventListener: function(EventName, callback){
			var _listeners = this._listeners
			if(_listeners[EventName]){
				var arr = _listeners[EventName];
				for(var idx = 0, cb = arr[idx]; arr[idx++];){
					if(cb.callback === callback) {
						arr.splice(idx, 1);
						return;
					}
				}
			}else{
				throw "no such event:[[" + EventName + "]]";
			}
		},
		emit: function(EventName, EventObj){
			var _listeners = this._listeners
			if(_listeners[EventName]){
				_listeners[EventName].forEach(function(cb){
					cb.callback.call(cb.context, EventObj);
				});
				
			}else{
				throw "no such event listener:[[" + EventName + "]]";
			}
		}
	}
}).call(window, app);