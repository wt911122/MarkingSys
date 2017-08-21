var app = this.app || {};

(function(app){
	function getNum(str){
		console.log(str);
		return +(/^(\d+)\.jpg/.exec(str)[1])
	}
	var imageOringinalWidth = undefined,
		imageOringinalHeight = undefined,
		imageScale = undefined, 
		imageDom = null,
		beginNum = undefined; 
	var tempvalue1 = false,
		tempvalue2 = false;


	app.dom = {
		fileListDom: undefined,
		classesDom: undefined,
		imageContainerDom: undefined,
		saveBtn: undefined,
		sweepBtn: undefined,
		classesChild: [],
		configure:{
			classes:[
				{
					name: "frontlock",
					title: "锁孔",
					ratio: 1,
					nowWidth: 20,
				}
			]
		},
		state: {
			mousedown: false,
			lastlocation: null,
			activeBox: null
		},
		activeSample: undefined,
		init: function(fileListDom, classesDom, imagepart, saveBtn, sweepBtn){
			this.fileListDom = fileListDom;
			this.classesDom = classesDom;
			this.imageContainerDom = imagepart;
			this.saveBtn = saveBtn;
			this.sweepBtn = sweepBtn;
			this._initClassesDom();
			this._initFileListDom();
			this._initImagepartDom();
			this._initBtnFunction();
			this._initMessageResolvor();
			this._initBoxResolver();
			this._initKeyDownListener();
		},
		_initClassesDom: function(){
			var classes = this.configure.classes;
			var self = this;
			classes.forEach(function(item, idx){
				self.classesChild.push(self._createClassesDom(item, idx === 0));
			});
		},
		_createClassesDom: function(item, focus){
			///<label><input type="radio" name="drawmode" value="people" />人</label>
			var label = document.createElement("label");
			var radioBtn = document.createElement("input");
			radioBtn.setAttribute("type", "radio");
			radioBtn.setAttribute("name", "classes");
			radioBtn.setAttribute("value", item.name);
			label.appendChild(radioBtn);
			label.innerHTML += item.name;
			if(focus) radioBtn.checked = true;
			this.classesDom.appendChild(label);
			return label;
		},
		getClassChosen: function(){
			var val = document.querySelector('input[name="classes"]:checked').value;
			console.log(val);
			return app.dom.configure.classes.filter(function(elem){
				return elem.name === val;
			})[0];
		},
		setClassChosenState: function(prop){
			document.querySelector('input[name="classes"][value="'+mode+'"]').checked = true;
		},
		_clearImageContainer: function(){
			var nodearr = this.imageContainerDom.querySelectorAll("div.box");
			var i = 0;
			while(nodearr[i]){
				//console.log(nodearr[i])
				this.imageContainerDom.removeChild(nodearr[i++]);
			}
			app.cache.clearCache();
		},
		_initBtnFunction: function(){
			var self = this;
			this.sweepBtn.onclick = this._clearImageContainer.bind(this);

			this.saveBtn.onclick = function(){
				console.log("save");
				var ws = app.websocket;
				var boxes = app.cache.getCache();
				var bound = self.imageContainerDom.getBoundingClientRect();
				console.log(self.activeSample);
				var data = {
					protocol: 3,
					boxes: [],
					name: self.activeSample.item.title
				}
				for(var idx in boxes){
					if(boxes.hasOwnProperty(idx)){
						var bd = boxes[idx].box.getBoundingClientRect();
						data.boxes.push({
							type: boxes[idx].type,
							x: (bd.left - bound.left) * imageScale,
							y: (bd.top - bound.top) * imageScale,
							width: bd.width * imageScale,
							height: bd.height * imageScale
						});
					}
				}
				//console.log(data)
				ws.send(JSON.stringify(data));
			}
		},
		_initMessageResolvor: function(){
			var ws = app.websocket;
			var self = this;
			ws.addEventListener(ws.Event.messageReceived.string, function(e){
				if(e.data.protocol === 3){
					// PROTOCOL_TRANS.REQUEST_TO_SAVE_DATA
					//console.log(e.data.data.name);
					self.highlightLi(e.data.data.name);
				}
			});
		},
		_initFileListDom: function(){
			var ws = app.websocket;
			var data = {
				protocol: 1
			}
			var self = this;
			ws.addEventListener(ws.Event.webSocketDidOpen, function(e){
				e.conn.send(JSON.stringify(data))
			});
			ws.addEventListener(ws.Event.messageReceived.string, function(e){
				if(e.data.protocol === data.protocol){
					self._createFileListDom(e.data);
				}
			})
		},

		_createFileListDom: function(list){
			var self = this;
			var flag = true;
			list.filelist.sort(function(a, b){
				return getNum(a.title) - getNum(b.title);
			}).forEach(function(item){
				if(flag) {beginNum = getNum(item.title); flag = false}
				var lidom = document.createElement('li');
				lidom.textContent = item.title;
				if(list.markedfilelist[item.title]) lidom.classList.add("highlight");
				lidom.addEventListener("click", self._lidomClickHandler(lidom, item));
				self.fileListDom.appendChild(lidom);
			});
		},
		_lidomClickHandler: function(dom, item){
			var ws = app.websocket;
			var data = {
				protocol: 2,
				path: item.path,
				title: item.title
			}
			var self = this;
			return function(event){
				if(self.activeSample) self.activeSample.dom.classList.remove('focus');
				self._clearImageContainer();
				self.activeSample = {
					item: item,
					dom: dom
				}
				dom.classList.add("focus");

				ws.send(JSON.stringify(data));
				console.log(imageDom);
				self._initImagepartDom(data.path);
			};
		},
		_initBoxResolver: function(){
			var ws = app.websocket,
				self = this;
			ws.addEventListener(ws.Event.messageReceived.string, function(e){
				if(e.data.protocol === 2){

					console.log(e.data)
					tempvalue1 = e.data
					self._boxResolver();
				}
			})
		},
		_boxResolver: function(){
			console.log(tempvalue1, tempvalue2)
			if(tempvalue1 && tempvalue2){
				var self = this;

				tempvalue1.boxes.forEach(function(item){
					//console.log(item);
					self._createBox(item, imageScale);
				});
				tempvalue1 = false;
				tempvalue2 = false;
			}
		},
		highlightLi: function(name){
			console.log(name);
			var idx = getNum(name) - beginNum;
			var element = this.fileListDom.querySelector("li:nth-child("+(idx+1)+")");
			element.classList.add("highlight");
		},
		_initImagepartDom: function(uri){
			//var ws = app.websocket;
			var self = this;
			//ws.addEventListener(ws.Event.messageReceived.blob, function(e){
			//	var uri = window.webkitURL.createObjectURL(e.data);
			//	console.log(uri)

			if(!imageDom){
				imageDom = new Image();
				imageDom.onload = self._initCanvas.bind(imageDom, self);
				imageDom.ondragstart = function(e){return false;}
				self.imageContainerDom.onclick = self._imageDomOnClickHandler.bind(self.imageContainerDom, self);
				self.imageContainerDom.onmousedown = self._imageMousedownHandler.bind(self.imageContainerDom, self);
				self.imageContainerDom.onmousemove = self._imageMousemoveHandler.bind(self.imageContainerDom, self);
				self.imageContainerDom.appendChild(imageDom);
			}
			imageDom.src = uri
			//});
		},
		_initCanvas: function(context){
			var self = this;
			var imagecache = new Image();
			imagecache.onload = function(){
				imageOringinalWidth = this.width;
				imageOringinalHeight = this.height;
				self.classList.add("responsible");
				var canvas = context.canvasDom;
				var bound = self.getBoundingClientRect();
				console.log(bound.width)
				imageScale = imageOringinalWidth / bound.width;

				tempvalue2 = true;
				context._boxResolver();
			}
			imagecache.src = this.src;
			
		},
		_createBox: function(data, scale){
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
			this.imageContainerDom.appendChild(div);
			return div;
		},
		_getRealAxis: function(e){
			var bound = imageDom.getBoundingClientRect();
			return { 
				x:e.pageX - bound.left,
				y:e.pageY - bound.top
			}
		},
		_imageDomOnClickHandler: function(context, event){
			event.preventDefault();
			//console.log(this, context, event);
			var state = context.state;
			if(!state.mousedown){
				if(state.activeBox){
					state.activeBox.classList.remove('active');
				}
				var POS = context._getRealAxis(event);
				var mode = context.getClassChosen();
				console.log(mode.ratio);
				var oX = POS.x - mode.nowWidth/2;
				var oY = POS.y - mode.nowWidth/mode.ratio/2;
				var box = context._createBox({
					x: oX, 
					y: oY,
					width: mode.nowWidth, 
					height: mode.nowWidth/mode.ratio,
					type: mode.name
				}, 1);
				box.classList.add('active');
				state.activeBox = box;

				// 加入缓存
				var idx = app.cache.saveToCache({
					box: box,
					type: mode.name
				});
			}else{
				console.log('click')
				state.mousedown = false;
			}
		},
		_imageMousedownHandler: function(context, e){
			var state = context.state;
			if(e.target.tagName.toLowerCase() === 'label'){
				var dom = e.target.parentNode || e.target.parentElement;
				if(state.activeBox && state.activeBox !== dom){
					state.activeBox.classList.remove('active');
				}
				//changeDrawMode(dom.id)
				state.mousedown = true;
				console.log(dom);
				var POS = context._getRealAxis(e);
				state.activeBox = dom;
				var innerbound = state.activeBox.getBoundingClientRect();
				state.lastlocation = POS;
				state.lastbound = innerbound;
				state.offset = {
					x: e.pageX - innerbound.left,
					y: e.pageY - innerbound.top
				}
				state.activeBox.classList.add('active');
			}
		},
		_imageMousemoveHandler: function(context, e){
			var state = context.state;
			if(state.mousedown){
				var POS = context._getRealAxis(e);
				var vector = {
					x: POS.x - state.lastlocation.x, 
					y: POS.y - state.lastlocation.y
				};
			
				var bound2 = imageDom.getBoundingClientRect();
				state.activeBox.style.left = state.lastbound.left - bound2.left+vector.x + 'px';
				state.activeBox.style.top = state.lastbound.top - bound2.top+vector.y + 'px';
			}
		},
		_initKeyDownListener: function(){
			var self = this;
			document.addEventListener('keydown', function(event){
				var state = self.state;
				if(state.activeBox){
					var mode = self.getClassChosen();
					switch(event.key){
						case 'ArrowUp':
							event.preventDefault();
							mode.nowWidth+=3;
							break;
						case 'ArrowDown':
							event.preventDefault();
							mode.nowWidth-=3;
							break;
					}
					console.log(mode.nowWidth, mode.nowWidth / mode.ratio);
					var bound = state.activeBox.getBoundingClientRect();
					//var bound2= imageDom.getBoundingClientRect();

					state.activeBox.style.width = mode.nowWidth + 'px';
					state.activeBox.style.height = mode.nowWidth / mode.ratio + 'px';
				}
			});
		}
	}
}).call(window, app);