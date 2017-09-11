var app = this.app || {};

(function(app){
	function getNum(str){
		return parseInt(str, 10)
	}
	var imageOringinalWidth = undefined,
		imageOringinalHeight = undefined,
		imageScale = undefined, 
		imageDom = null,
		beginNum = undefined; 
	var tempvalue1 = false,
		tempvalue2 = false;
	var fileNameList = [];
	var selected = {
		folder: undefined,
		tag: undefined,
		object: undefined,
		schema: undefined,
	};

	function setSelected({
		folder,
		tag,
		object,
		schema,
	}){
		if(folder) selected.folder = folder;
		if(tag) selected.tag = tag;
		if(object) selected.object = object;
		if(schema) selected.schema = schema;
	}

	app.dom = {
		fileListDom: undefined,
		classesDom: undefined,
		imageContainerDom: undefined,
		saveBtn: undefined,
		sweepBtn: undefined,
		classesChild: [],
		schemasChild: [],
		configure:{
			classes:[],
		},
		state: {
			mousedown: false,
			lastlocation: null,
			activeBox: null
		},
		activeSample: undefined,
		init: function({
			fileListDom, 
			tagListDom,
			objectListDom,
			folderListDom,
			strategyListDom,
			classesDom, 
			imagepart, 
			saveBtn, 
			sweepBtn, 
			downloadBtn,
			newSchemaBtn
		}){
			this.fileListDom = fileListDom;
			this.tagListDom = tagListDom;
			this.objectListDom = objectListDom;
			this.folderListDom = folderListDom;
			this.strategyListDom = strategyListDom;
			this.classesDom = classesDom;
			this.imageContainerDom = imagepart;
			this.saveBtn = saveBtn;
			this.sweepBtn = sweepBtn;
			this.downloadBtn = downloadBtn;
			this.newSchemaBtn = newSchemaBtn;
			// this._initClassesDom();
			this._initFolderListDom();
			this._initTagListDom();
			this._initFileListDom();
			// this._initImagepartDom();
			this._initBtnFunction();
			this._initMessageResolvor();
			// this._initBoxResolver();
			// this._initKeyDownListener();
		},
		_initObjectsDom: function(){
			var classes = this.configure.classes;
			var self = this;
			classes.forEach(function(item, idx){
				self.classesChild.push(self._createClassesDom(item, idx === 0));
			});
		},
		_createClassesDom: function(item, focus){
			///<label><input type="radio" name="drawmode" value="people" />人</label>
			var label = document.createElement("label");
			/*var radioBtn = document.createElement("input");
			radioBtn.setAttribute("type", "radio");
			radioBtn.setAttribute("name", "classes");
			radioBtn.setAttribute("value", item);
			label.appendChild(radioBtn);*/
			label.innerHTML = `<input type="radio" name="classes" value="${item}" ${focus?'checked': ''}/>${item}`;
			
			this.objectListDom.appendChild(label);
			return label;
		},
		getClassChosen: function(){
			var tag = this.tagListDom.value;
			var schema = this.strategyListDom.value;
			var val = document.querySelector('input[name="classes"]:checked').value;
			console.log(val);
			var tag = app.dom.configure.classes.find((item) => (item.tag === tag));
			var object =	tag.objects.find((elem)=> (elem.object === val));
			return {
				tag: tag.tag,
				width: parseInt(tag.width),
				height: parseInt(tag.height),
				object: object,
				ratio: parseInt(tag.width) / parseInt(tag.height),
				schema: schema,
			}
		},
		getSchemaChosen: function(){

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
			app.mark.clear();
		},
		_initBtnFunction: function(){
			var self = this;
			this.sweepBtn.onclick = this._clearImageContainer.bind(this);

			this.saveBtn.onclick = function(){
				console.log("save");
				var ws = app.websocket;
				// var boxes = app.cache.getCache();
				var bound = self.imageContainerDom.getBoundingClientRect();
				console.log(self.activeSample);
				var data = {
					protocol: 3,
					boxes: app.mark.exportBoxes(),
					name: self.activeSample.item.title,
					path: self.activeSample.item.path,
					tag: self.getClassChosen().tag,
					schema: self.strategyListDom.value,
				}
				console.log(data);
				/*for(var idx in boxes){
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
				}*/

				//console.log(data)
				ws.send(JSON.stringify(data));
			}
			this.downloadBtn.onclick = function(){
				// Todo  下载接口
				
				var val = selected.tag;
				if(val){
					app.downloadModal.toggle();
					app.downloadModal.setState(selected, self.configure.classes.find((item) => (item.tag === val)));
				}
				
			}

			this.newSchemaBtn.onclick = function(){
				app.schemaModel.toggle();
				var val = selected.tag;
				app.schemaModel.createSchemaOption(self.configure.classes.find((item) => (item.tag === val)));
			}
		},
		_initMessageResolvor: function(){
			var ws = app.websocket;
			var self = this;
			ws.addEventListener(ws.Event.messageReceived.string, function(e){
				console.log(e.data)
				if(e.data.protocol === 3){
					// PROTOCOL_TRANS.REQUEST_TO_SAVE_DATA
					//console.log(e.data.data.name);
					console.log(e.data.data);
					if(e.data.data.folder === selected.folder){
						if(e.data.data.empty){
							self.dehighlintLi(e.data.data.name);
						}else{
							self.highlightLi(e.data.data.name);
						}
					}
				}
			});
		},
		_initFolderListDom: function(){
			var ws = app.websocket;
			var data = {
				protocol: 0
			}
			var self = this;
			ws.addEventListener(ws.Event.webSocketDidOpen, function(e){
				e.conn.send(JSON.stringify(data))
			});
			ws.addEventListener(ws.Event.messageReceived.string, function(e){
				if(e.data.protocol === data.protocol){
					self._createFolderListDom(e.data.folderList);
				}
			});
			this.folderListDom.addEventListener("change", (e) => {
				var val = this.folderListDom.value;
				if(val){
					setSelected({
						folder: val,
					})
					this._requestFileList();

				}
			})

		},
		_requestFileList: function(){
			var ws = app.websocket;
			var data = {
				protocol: 1,
				...selected
			}
			ws.send(JSON.stringify(data));
		},
		_createFolderListDom: function(data){
			data.forEach((item) => {
				var option = document.createElement("option");
				option.setAttribute("value", item.path);
				option.innerText = item.title;
				this.folderListDom.appendChild(option);
			});
		},
		_initTagListDom: function(){
			var ws = app.websocket;
			var tag = {
				protocol: 4
			}
			var self = this;
			ws.addEventListener(ws.Event.webSocketDidOpen, function(e){
				e.conn.send(JSON.stringify(tag));
			});
			ws.addEventListener(ws.Event.messageReceived.string, function(e){
				if(e.data.protocol === tag.protocol){
					self._createTagsList(e.data.tagList);
					self._createObjectList(e.data.tagList[0].tag);
					self._createSchemaList(e.data.tagList[0].tag);
				}
			});
			this.tagListDom.addEventListener("change", (e) => {
				var val = this.tagListDom.value;
				if(val){
					setSelected({
						tag: val,
					})
					this._createObjectList(val);
					this._createSchemaList(val);
					this._clearImageContainer();
					this._requestFileList();
				}
			})

			this.strategyListDom.addEventListener("change", (e) => {
				var val = this.strategyListDom.value;
				if(val){
					setSelected({
						schema: val,
					})
					this._clearImageContainer();
					this._requestFileList();
				}
			})
		},
		_createTagsList: function (data){
			this.configure.classes = data;
			data.forEach((item, idx) => {
				if(idx == 0) {
					setSelected({
						tag: item.tag,
					})
				}
				var option = document.createElement("option");
				option.setAttribute("value", item.tag);
				option.innerText = item.tag;
				this.tagListDom.appendChild(option);
			});
		},
		_createObjectList: function(val){
			var self = this;
			var tag = this.configure.classes.find((item) => (item.tag === val));
			this.classesChild = [];
			this.objectListDom.innerHTML = "";
			tag.objects.forEach(function(item, idx){
				console.log(item.object, idx === 0)
				self.classesChild.push(self._createClassesDom(item.object, idx === 0));
			});
		},
		_createSchemaList: function(val) {
			console.log("create schema")
			var self = this;
			var tag = this.configure.classes.find((item) => (item.tag === val));
			this.schemasChild = [];
			this.strategyListDom.innerHTML = "";
			tag.schemas.forEach(function(item, idx){
				if(idx == 0) {
					setSelected({
						schema: item.schema,
					});
				}
				self.schemasChild.push(self._createSchemasDom(item.schema, idx === 0));
			});
		},
		_createSchemasDom: function(val){
			var option = document.createElement("option");
			option.setAttribute("value", val);
			option.innerText = val;
			this.strategyListDom.appendChild(option);
			return option;
		},
		_initFileListDom: function(){
			var ws = app.websocket;
			var self = this;
			/*ws.addEventListener(ws.Event.webSocketDidOpen, function(e){
				e.conn.send(JSON.stringify(data))
			});*/
			ws.addEventListener(ws.Event.messageReceived.string, function(e){
				if(e.data.protocol === 1){
					self._createFileListDom(e.data);
				}
			})
		},
		_createFileListDom: function(list){
			var self = this;
			// var flag = true;
			this.fileListDom.innerHTML = "";
			var templist = list.filelist.sort(function(a, b){
				return getNum(a.title) - getNum(b.title);
			})
			templist.forEach(function(item){
				// if(flag) {beginNum = getNum(item.title); flag = false}
				var lidom = document.createElement('li');
				lidom.textContent = item.title;
				if(list.markedfilelist[item.title]) lidom.classList.add("highlight");
				lidom.addEventListener("click", self._lidomClickHandler(lidom, item));
				self.fileListDom.appendChild(lidom);
			});
			fileNameList = templist.map((item) => {
				return item.title;
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

				ws.send(JSON.stringify(Object.assign(data, selected)));
				// console.log(imageDom);
				app.mark.setImage(data.path)
				//self._initImagepartDom(data.path);
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
		dehighlintLi: function(name){
			var idx = fileNameList.indexOf(name);
			var element = this.fileListDom.querySelector("li:nth-child("+(idx+1)+")");
			element.classList.remove("highlight");
		},
		highlightLi: function(name){
			console.log(name);

			var idx = fileNameList.indexOf(name);
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
			console.log(data);
			div.id = data.type;
			div.classList.add("box");
			div.classList.add(data.type);
			div.style.left = data.x/scale + 'px';
			div.style.top = data.y/scale+ 'px';
			div.style.width = data.width/scale+ 'px';
			div.style.height = data.height/scale+ 'px';
			var label = document.createElement("label");
			label.classList.add('label');
			label.textContent = data.object;
			label.style.backgroundColor = data.color;
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
			console.log(context);
			if(!state.mousedown){
				if(state.activeBox){
					state.activeBox.classList.remove('active');
				}
				var POS = context._getRealAxis(event);
				var mode = context.getClassChosen();
				console.log(mode);
				var oX = POS.x - mode.width/2;
				var oY = POS.y - mode.height/2;
				var box = context._createBox({
					x: oX, 
					y: oY,
					width: mode.width, 
					height: mode.height,
					ratio: mode.ratio,
					...mode.object,
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
					console.log(mode)
					switch(event.key){
						case 'ArrowUp':
							event.preventDefault();
							mode.width += 3;
							break;
						case 'ArrowDown':
							event.preventDefault();
							mode.width -= 3;
							break;
					}
					mode.height = mode.width / mode.ratio;
					console.log(mode.width, mode.width / mode.ratio);
					var bound = state.activeBox.getBoundingClientRect();
					//var bound2= imageDom.getBoundingClientRect();

					state.activeBox.style.width = mode.width + 'px';
					state.activeBox.style.height = mode.height + 'px';
				}
			});
		}
	}
}).call(window, app);