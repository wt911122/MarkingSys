var app = window.app || {};

(function(app){
  var markZone = Object.create(app.Event);

  var zone = {};
  var img = {};
  var boxes = [];
  var chosen = {};
  var clickState = true;
  var _getClassChosen = app.dom.getClassChosen.bind(app.dom);
  var mouseDown = false;

  markZone.init = function(dom){
    zone = {
      dom: dom,
    };
    boxes = [];
    img = {};
    addEventListener();
  }

  markZone.setImage = function(url){
    zone.dom.innerHTML = "";
    var imgDom = new Image();
    imgDom.onload = imageOnload;
    imgDom.ondragstart = function(e){return false;}
    imgDom.src = url;
    img.dom = imgDom
    zone.dom.appendChild(imgDom);
  }

  markZone.clear = function(){
    boxes = [];
  }

  markZone.exportBoxes = function(){
    const {
      scale
    } = img;
    return boxes.map(({dom, data}) => ({
      tag: data.tag,
      type: data.object,
      x: data.x * scale,
      y: data.y * scale,
      width: data.width * scale,
      height: data.height * scale
    }));
  }

  function imageOnload(){
    var bound = this.getBoundingClientRect();
    img.width = bound.width;
    img.height = bound.height;
    img.scale = bound.width /  zone.dom.getBoundingClientRect().width;
    this.classList.add("responsible");    
  }

  function addEventListener() {
    
    zone.dom.addEventListener('mousemove', _mouseMoveHandler);
    zone.dom.addEventListener('click', _clickHandler);
    document.addEventListener('keydown', _keydownHandler);

    var ws = app.websocket;
    ws.addEventListener(ws.Event.messageReceived.string, (e) => {
      if(e.data.protocol === 2){

        console.log(e.data.boxes)
        _boxResolver(e.data.boxes);
       // tempvalue1 = e.data
        //self._boxResolver();
      }
    })
  }

  function _clickHandler(e) {
    
    e.preventDefault();
    if(!clickState){
      clickState = true;
      return;
    }
    //console.log("click");
    const {x, y} = _getRealAxis(e);
    //console.log(zone.dom.getBoundingClientRect());
    const {
      width,
      height,
      object,
      tag,
      schema,
    } = _getClassChosen();
    const {
      scale
    } = img;

    const w = width / scale;
    const h = height / scale;

    const data = {
      x: x - w / 2,
      y: y - h / 2,
      width: w,
      height: h,
      tag: tag,
      schema: schema,
      object: object.object,
      color: object.color
    }
    const dom = _createBoxDOM(data);
    boxes.push({
      dom: dom,
      data: data
    });
    _setChosen(dom, data);
  }

  function _setChosen(dom, data){
    if(chosen.dom){
      chosen.dom.classList.remove('active');
    }
    chosen.dom = dom;
    chosen.dom.classList.add('active');
    chosen.data = data;
  }

  function _mouseMoveHandler(e){
    e.preventDefault();
    if(!mouseDown) return;
    const {x, y} = _getRealAxis(e);
    if(mouseDown.name === "label"){
      //console.log(mouseDown);
      const vecX = x - mouseDown.initialDownPos.x;
      const vecY = y - mouseDown.initialDownPos.y;
      //console.log(vecX, vecY);
      const newX = mouseDown.data.x + vecX;
      const newY = mouseDown.data.y + vecY;
       //console.log(newX, newY);
      mouseDown.dom.style.left = newX + 'px';
      mouseDown.dom.style.top = newY + 'px';
      mouseDown.newX = newX;
      mouseDown.newY = newY;
    }

    if(mouseDown.name === "scalePoint"){
      //console.log(mouseDown);
      /*const {
        x,
        y,
        width,
        height,
      } = mouseDown.data;*/
      const vecX = x - mouseDown.initialDownPos.x;
      const vecY = y - mouseDown.initialDownPos.y;
      let newX, newY, newW, newH;
      newX = mouseDown.data.x;
      newY = mouseDown.data.y;
      newW = mouseDown.data.width + vecX;
      newH = mouseDown.data.height + vecY;
      if(newW >= 0){
        mouseDown.dom.style.width = newW + 'px';
      }else{
        newW = -newW;
        newX = newX - newW;
        mouseDown.dom.style.width = newW + 'px';
        mouseDown.dom.style.left = newX + 'px';
      }

      if(newH >= 0){
        mouseDown.dom.style.height = newH + 'px';
      }else{
        newH = -newH;
        newY = newY - newH;
        mouseDown.dom.style.height = newH + 'px';
        mouseDown.dom.style.top = newY + 'px';
      }

      mouseDown.newX = newX;
      mouseDown.newY = newY;
      mouseDown.newW = newW;
      mouseDown.newH = newH;
    }
  }

  function _createBox(){

  }

  function _getRealAxis(e){
    var bound = zone.dom.getBoundingClientRect();
    return { 
      x:e.pageX - bound.left,
      y:e.pageY - bound.top
    }
  }
  function _createBoxDOM(data){
    var div = document.createElement("div");
    //console.log(data);
    div.classList.add("box");
    div.style.left = data.x + 'px';
    div.style.top = data.y+ 'px';
    div.style.width = data.width+ 'px';
    div.style.height = data.height+ 'px';
    var label = document.createElement("label");
    label.classList.add('label');
    label.textContent = data.object;
    label.style.backgroundColor = data.color;
    label.addEventListener('mousedown', function(e){
      e.stopPropagation();
      e.preventDefault();
      mouseDown = {
        name: "label",
        initialDownPos: _getRealAxis(e),
        dom: div,
        data: data,
        newX: data.x,
        newY: data.y
      }
      _setChosen(div, data);
    });
    label.addEventListener('mouseup', function(e){
      e.stopPropagation();
      e.preventDefault();
      //console.log("mouseup")
      data.x = mouseDown.newX;
      data.y = mouseDown.newY;
      mouseDown = false;
      clickState = false;
    });

    var scalePoint = document.createElement("div");
    scalePoint.classList.add("control-point");

    scalePoint.addEventListener('mousedown', function(e){
      e.stopPropagation();
      e.preventDefault();
      mouseDown = {
        name: "scalePoint",
        initialDownPos: _getRealAxis(e),
        dom: div,
        data: data,
        newX: data.x,
        newY: data.y,
        newW: data.width,
        newH: data.height
      }
      _setChosen(div, data);
    });

    scalePoint.addEventListener('mouseup', function(e){
      e.stopPropagation();
      e.preventDefault();
      //console.log("mouseup")
      data.width = mouseDown.newW;
      data.height = mouseDown.newH;
      data.x = mouseDown.newX;
      data.y = mouseDown.newY;
      mouseDown = false;
      clickState = false;
    });

    div.appendChild(label);
    div.appendChild(scalePoint);
    zone.dom.appendChild(div);
    return div;
  }
  function _keydownHandler(event){
    switch(event.key){
      case 'ArrowUp':
        event.preventDefault();
        _scaleBox(3);
        break;
      case 'ArrowDown':
        event.preventDefault();
        _scaleBox(-3);
        break;
    }
  };

  function _scaleBox(span){
    if(!chosen){
      return
    }

    const {
      data,
      dom
    } = chosen;

    const {
      width,
      height
    } = data;

    const newW = width + span;
    const newH = newW / width * height;
    data.width = newW;
    data.height = newH;

    dom.style.width = data.width+ 'px';
    dom.style.height = data.height+ 'px';
  }

  function _boxResolver(datas){
    const { scale } = img;

    datas.forEach((box) => {
      const data = {
        x: box.x / scale,
        y: box.y / scale,
        width: box.width / scale,
        height: box.height / scale,
        tag: box.tag,
        object: box.type.object,
        color: box.type.color
      }
      const dom = _createBoxDOM(data);
      boxes.push({
        dom: dom,
        data: data
      });
    })
  }

  app.mark = markZone;
}).call(window, app);