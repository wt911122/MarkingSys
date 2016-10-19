var app = this.app || {};

(function(){
	app.cache = (function(){
		var cache = {};
		var idx = 0;
		function _get_idx(){
			return idx++;
		}
		function _clone(obj){
			var result = {};
			for(item in obj){
				(result[item] instanceof Node) ? _clone(obj[item]) : result[item] = obj[item];
			}
			return result;
		}

		return {
			saveToCache: function(obj){
				var idx = _get_idx();
				Object.defineProperty(cache, idx, {
					enumerable: true,
					configurable: true,
					writable: false,
					value: obj
				});

				return idx;
			},
			getCache: function(){
				return _clone(cache);
			},
			clearCache: function(){
				cache = {};
			}
		}

	})();
}).call(window)