var app = this.app || {};

(function(app){
	function getNum(str){
		return +(/^[^\d]+(\d+)\.jpg$/.exec(str)[1]);
	}
	var imageOringinalWidth = undefined,
		imageOringinalHeight = undefined,
		imageScale = undefined, 
		imageDom = null;

	app.dom = {
		fileListDom: undefined,
		classesDom: undefined,
		imageContainerDom: undefined,
		canvasDom: undefined,
		classesChild: [],
		configure:{
			classes:[
				{
					name: "frontlock",
					title: "前锁孔",
					ratio: 1,
					nowWidth: 20,
				},
				{
					name: "backlock",
					title: "后锁孔",
					ratio: 1,
					nowWidth: 20,
				},
				{
					name: "frontend",
					title: "前端",
					ratio: 3.5,
					nowWidth: 60,
				},
				{
					name: "backend",
					title: "后端",
					ratio: 3.5,
					nowWidth: 60,
				}
			]
		},
		state: {
			mousedown: false,
			lastlocation: null,
			activeBox: null
		},
		init: function(fileListDom, classesDom, imagepart, canvasDom){
			this.fileListDom = fileListDom;
			this.classesDom = classesDom;
			this.imageContainerDom = imagepart;
			this.canvasDom = canvasDom;
			this._initClassesDom();
			this._initFileListDom();
			this._initImagepartDom();
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


		_initFileListDom: function(){
			var ws = app.websocket;
			var data = {
				protocol: 1
			}
			var self = this;
			ws.addEventListener(ws.Event.webSocketDidOpen, function(e){
				e.conn.send(JSON.stringify(data))
			});
			ws.addEventListener(ws.Event.messageReceived, function(e){
				if(typeof e.data !== "string") return;
				var comingdata = JSON.parse(e.data);
				if(comingdata.protocol === data.protocol){
					self._createFileListDom(comingdata);
				}
			})
		},
		_createFileListDom: function(list){
			var self = this;
			list.filelist.sort(function(a, b){
				return getNum(a.title) - getNum(b.title);
			}).forEach(function(item){
				var lidom = document.createElement('li');
				lidom.textContent = item.title;
				lidom.addEventListener("click", self._lidomClickHandler(item));
				self.fileListDom.appendChild(lidom);
			})
		},
		_lidomClickHandler: function(item){
			var ws = app.websocket;
			var data = {
				protocol: 2,
				path: item.path
			}
			var self = this;
			return function(event){
				ws.send(JSON.stringify(data));
			}
		},
		_initImagepartDom: function(){
			var ws = app.websocket;
			var self = this;
			ws.addEventListener(ws.Event.messageReceived, function(e){
				if(e.data instanceof Blob){
					var uri = window.webkitURL.createObjectURL(e.data);
					console.log(uri)
					var imagecache = new Image();
					imagecache.onload = function(){
						imageOringinalWidth = this.width;
						imageOringinalHeight = this.height;
					}
					imagecache.src = uri;
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
				}
			})
		},
		_initCanvas: function(context){
			this.classList.add("responsible");
			var canvas = context.canvasDom;
			var bound = this.getBoundingClientRect();
			imageScale = imageOringinalWidth / bound.width;
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
			console.log(this, context, event);
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
		}
	}
}).call(window, app);