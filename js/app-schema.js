var app = window.app || {};

(function(app){
  const state = {
    show: false,

  }

  const modalDom = document.getElementById("modal-schema");
  const coverDom = modalDom.querySelector(".cover");
  const schemaNameDom = modalDom.querySelector(".schema-name");
  const tagDom = modalDom.querySelector(".schema-tag");
  const schemaBriefDom = modalDom.querySelector(".schema-brief");
  const schemasDom = modalDom.querySelector(".schema-base");
  const btnsubmit = modalDom.querySelector(".btn.btn-download");
  const modal = {
    init: function(){
      modalDom.classList.add('hidden');
      btnsubmit.addEventListener("click", _createSchemaHandler);
      coverDom.addEventListener("click", this.toggle);
    },

    toggle: function(){
      console.log("click")
      if(state.show){
        modalDom.classList.add('hidden');
      }else{
        modalDom.classList.remove('hidden');
      }
      state.show = !state.show;
    },

    createSchemaOption: function(data){  
      tagDom.innerHTML = data.tag;
      this.tag = data.tag;
      schemasDom.innerHTML = "<option value='undefined'>无</option>";
      data.schemas.forEach((item) => {
        var option = document.createElement("option");
        option.setAttribute("value", item.schema);
        option.innerText = item.schema;
        schemasDom.appendChild(option);
      });
    },
  }

  function toQuery(data){
    return Object.keys(data).map((item) => (`${item}=${encodeURI(data[item])}`)).join("&");
  }

  function _createSchemaHandler(e){
    e.preventDefault();
    var name = schemaNameDom.value;
    var brief = schemaBriefDom.value; 
    if(!name||!brief){
      alert("方案名和简介必填！");
      return;
    }
    var data = {
      protocol: 7,
      data: {
        schema: name,
        brief: brief,
        tag: modal.tag,
        base: schemasDom.value,
      }
    }
    var ws = app.websocket;
    ws.send(JSON.stringify(data));
    ws.addEventListener(ws.Event.messageReceived.string, function(e){
      if(e.data.protocol === data.protocol){
        // PROTOCOL_TRANS.REQUEST_TO_SAVE_DATA
        //console.log(e.data.data.name);
        if(e.data.ok){
          //modal.toggle();
          alert("添加成功！请刷新界面以重载方案！")
        }  
      }
    });
  }

  app.schemaModel = modal;
}).call(window, app);