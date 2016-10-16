var util = {
	deepClone: function(source){
		var result={};
		for (var key in source) {
			result[key] = typeof source[key]==='object'? this._deepClone(source[key]): source[key];
		} 
		return result; 
	}
}

var ObserverModule = (function(){
	var app = {
		state: {},
		listeners: [],
		addEventListener: function(func, ctx){
			//if(!listeners.which) listeners[which] = [];
			this.listeners.push({
				callback: func,
				context: ctx,
			});
		},
		_emit: function(changelist){
			//if(listeners[which]){
			var self = this;
			this.listeners.forEach(function(ls){
				//console.log(ls.context.prop.title)
				ls.callback.call(ls.context, self.state);
			});		
			/*}else{
				throw "no such event: [[" + which + "]]";
			}*/
		},
		setState: function(newState, oldState){
			if(!oldState){
				oldState = this.state;
			}
			//var stateChangeList = [];
			this._setState(newState, oldState);
			this._emit();
			console.log("state:" + JSON.stringify(this.state));
			return oldState;
		},
		_setState: function(newState, oldState){
			for(stat in newState){
				if(newState.hasOwnProperty(stat)){
					if(oldState[stat] && typeof oldState[stat] === "object"){
						this._setState(newState[stat], oldState[stat]);
					}else{
						if(typeof newState[stat] === "object"){
							oldState[stat] = util.deepClone(newState[stat]);
						}
						else
							oldState[stat] = newState[stat];
					}
				}
			}
		}
	}
	return app;
}).call(window);

var appDomModule = (function(){
	/**
		wrapper interface
		parameter: 
		{
			creator: function,
			initialState: {},
			reactionToStateChange: function(oldState, newState)
		}
	**/
	var DOMWrapper = function(boots){
		this.dom = boots.creator();
		this.prop = boots.prop || {};
		//this.state = {};
		this._regist(boots.reactionToStateChange);

	}
	DOMWrapper.prototype._regist = function(func){
		var self = this;
		ObserverModule.addEventListener(function(newState){
			console.log("hehe")
			func.call(self, newState);
			// self.state = Object.create(newState);
		}, this);
	}


	var DomMaster = {
		getNum: function(str){
			//console.log(str);
			return +(/^[^\d]+(\d+)\.jpg$/.exec(str)[1]);
		},
		bootList: function(list){
			var listdom = document.getElementById("list");
			var getNum = this.getNum;
			list.filelist.sort(function(a, b){
				return getNum(a.title) - getNum(b.title);
			}).forEach(function(item){
				var lidom = new DOMWrapper({
					prop: item,	
					creator: function(){
						console.log("create")
						var li = document.createElement('li');
						li.textContent = item.title;
						li.addEventListener("click", function(){
							ObserverModule.setState({
								activeItem: item
							});
						})
						return li;
					},
					reactionToStateChange: function(newState){
						//console.log(oldState.activeItem, newState.activeItem)
						if(newState.activeItem.title === this.prop.title){
							console.log(newState.activeItem.title, this.prop.title)
							this.dom.classList.add("focus");
						}else{
							this.dom.classList.remove("focus");
						}
					}
				});
				listdom.appendChild(lidom.dom);
			});
		}
	}
	return DomMaster;
}).call(window);

var DRAW_MODULE = (function(){
	var DrawMode = {
		frontlock: {
			name: "frontlock",
			ratio: 1,
			nowWidth: 20,
		},
		backlock: {
			name: "backlock",
			ratio: 1,
			nowWidth: 20,
		},
		frontend: {
			name: "frontend",
			ratio: 6,
			nowWidth: 20,
		},
		backend: {
			name: "backend",
			ratio: 6,
			nowWidth: 20,
		}
	}

	var imageDom,
		lasttarget = null,
		drawLayer = document.getElementById('absolutelayer');
	var image_container = document.getElementById('imagepart');

	function getRealAxis(e){
		var bound = imageDom.getBoundingClientRect();
		return { 
			x:e.pageX - bound.left,
			y:e.pageY - bound.top
		}
	}	
	function getDrawMode(){
		return "lock";
	}
	function createBox(data, scale){
		console.log(scale);
		var div = document.createElement("div");
		div.id = data.type;
		div.classList.add("box");
		div.classList.add(data.type);
		div.style.left = data.x/scale + 'px';
		div.style.top = data.y/scale+ 'px';
		div.style.width = data.width/scale+ 'px';
		div.style.height = data.height/scale+ 'px';
		var label = document.createElement("label");
		label.classList.add('label');
		label.textContent = data.type;
		div.appendChild(label);
		drawLayer.appendChild(div);
		return div;
	}
	var module = {
		state: {
			mousedown: false,
			lastlocation: null,
			//drawmode: this.getDrawMode,
			DOMelem: null
		},
		setImage: function(uri){
			if(!imageDom){
				var image_container = document.getElementById('imagepart');
				imageDom = new Image();
				image_container.appendChild(imageDom);
				imageDom.onload = this.ImageLoadHandler.bind(imageDom, this);

			}
			imageDom.classList.remove('responsible');
			imageDom.dataset.origin = uri;
			imageDom.src = uri;
			
		},
		ImageLoadHandler: function(context){
			var state = context.state;
			console.log("loaded");
			this.dataset.originWidth = this.width;
			this.dataset.originHeight = this.height;

			this.classList.add('responsible');
			var bound = imageDom.getBoundingClientRect();
			var scale = imageDom.dataset.originWidth / bound.width;
			drawLayer.style.width = bound.width + 'px';
			drawLayer.style.height = bound.height + 'px';
			drawLayer.style.left = 0 + 'px';
			drawLayer.style.top = bound.top + 'px';

			if(drawLayer.hasChildNodes()){
				while (drawLayer.firstChild) {
				    drawLayer.removeChild(drawLayer.firstChild);
				}
			}

			drawLayer.addEventListener('mousedown', function(e){
				if(e.target.tagName.toLowerCase() === 'label'){
					var dom = e.target.parentNode || e.target.parentElement;
					if(state.DOMelem && state.DOMelem !== dom){
						state.DOMelem.classList.remove('active');
					}
					//changeDrawMode(dom.id)
					state.mousedown = true;
					console.log(dom);
					var POS = getRealAxis(e);
					state.DOMelem = dom;
					var innerbound = state.DOMelem.getBoundingClientRect();
					state.lastlocation = POS;
					state.lastbound = innerbound;
					state.offset = {
						x: e.pageX - innerbound.left,
						y: e.pageY - innerbound.top
					}
					state.DOMelem.classList.add('active');
				}
			});

			drawLayer.addEventListener('mousemove', function(e){
				
				if(state.mousedown){

					var POS = getRealAxis(e);
					var vector = {
						x: POS.x - state.lastlocation.x, 
						y: POS.y - state.lastlocation.y
					};
				
					var bound2 = imageDom.getBoundingClientRect();
					state.DOMelem.style.left = state.lastbound.left - bound2.left+vector.x + 'px';
					state.DOMelem.style.top = state.lastbound.top - bound2.top+vector.y + 'px';
				}
			});
			drawLayer.addEventListener('mouseup', function(e){
				if(e.target.tagName.toLowerCase() === 'label'){

				}
			});
			drawLayer.addEventListener('click', function(e){
				e.preventDefault();
				if(!state.mousedown){
					if(state.DOMelem){
						state.DOMelem.classList.remove('active');
					}
					var POS = getRealAxis(e);
					var mode = DrawMode[getDrawMode()];
					var oX = POS.x - mode.nowWidth/2;
					var oY = POS.y - mode.nowWidth/mode.ratio/2;
					var box = createBox({
						x: oX, 
						y: oY,
						width: mode.nowWidth, 
						height: mode.nowWidth/mode.ratio,
						type: mode.name
					}, 1);
					box.classList.add('active');
					state.DOMelem = box;
				}else{
					console.log('click')
					state.mousedown = false;
				}
			});	
		}	
	}

	return module;
}).call(window);

(function(){
	var wsUrl = "ws://localhost:10086";
	var ws;
	var PROTOCOL_TRANS = {
		REQUEST_FILE_LIST: 1,
		REQUEST_A_PHOTO: 2
	}
	// 预加载模块
	window.onload = function(){
		ws = new WebSocket(wsUrl);
		ws.onopen = function(e){
			log("Connected");
			REQUEST_FILE_LIST.request();
		}
		ws.onmessage = function(e){
			console.log(e.data);
			if(typeof e.data === "string"){
				var dt = JSON.parse(e.data);
				if(dt.protocol === PROTOCOL_TRANS.REQUEST_FILE_LIST){
					REQUEST_FILE_LIST.response(dt);
				}
			}
			if(e.data instanceof Blob){
				console.log("blob")
				REQUEST_A_PHOTO.response(e.data);
			}
		}
		ws.onerror = function(e){
			log("Error");
		}

	}
	function log(msg){
		console.log(msg);
	}

	const REQUEST_FILE_LIST = {
		//lasttarget: undefined,
		oldState: {},
		request: function(){
			var data = {
				protocol: PROTOCOL_TRANS.REQUEST_FILE_LIST
			}
			ws.send(JSON.stringify(data));
		},
		response: function(list){
			console.log(appDomModule);
			appDomModule.bootList(list);
			ObserverModule.addEventListener(function(newState){
				if(this.oldState.title !== newState.activeItem.title){
					REQUEST_A_PHOTO.request(newState.activeItem.path);
					this.oldState = util.deepClone(newState.activeItem);
				}
			}, this);
		}
	}

	const REQUEST_A_PHOTO = {
		request: function(path){
			var data = {
				protocol: PROTOCOL_TRANS.REQUEST_A_PHOTO,
				path: path
			}
			ws.send(JSON.stringify(data));
		},
		response: function(blob){
			console.log("message: " + blob.size + " bytes");
			if (window.webkitURL) {
	            URL = webkitURL;
	        }

	        var uri = URL.createObjectURL(blob);
	        DRAW_MODULE.setImage(uri);
		}
	}
}).call(window)