var app = window.app || {};

(function(app){
  const state = {
    show: false,

  }

  const modalDom = document.getElementById("modal");
  const coverDom = modalDom.querySelector(".cover");
  const folderDom = modalDom.querySelector(".filter-list > .folder-mod");
  const tagDom = modalDom.querySelector(".filter-list > .tag-mod");
  const schemaDom = modalDom.querySelector(".filter-list > .schema-mod");
  const objectlistDom = modalDom.querySelector(".filter-list > .object-mod");
  const formatsDom = modalDom.querySelector("#formats");
  console.log(formatsDom);
  const btnsubmit = modalDom.querySelector(".btn.btn-download");
  const modal = {
    init: function(){
      modalDom.classList.add('hidden');
      btnsubmit.addEventListener("click", _downloadHandler);
      coverDom.addEventListener("click", this.toggle);
    },

    toggle: function(){
      if(state.show){
        modalDom.classList.add('hidden');
      }else{
        modalDom.classList.remove('hidden');
      }
      state.show = !state.show;
    },
    setState: function(state, tagnow){
      const {
        folder,
        schema,
        tag
      } = state;
      this.state = state;
      folderDom.innerText = folder;
      tagDom.innerText = tag;
      schemaDom.innerText = schema;
      createObjects(tagnow.objects);
    }
  }

  function toQuery(data){
    return Object.keys(data).map((item) => {
      const prop = data[item];
      if(typeof prop === "string"){
        return `${item}=${encodeURI(prop)}`
      }else if(Array.isArray(prop)){
        return `${item}=${encodeURI(prop.join(';'))}`
      }
      return '';
    }).join("&");
  }

  function createObjects(data) {
    objectlistDom.innerHTML = "";
    var innerhtml = data.map((o) => (
      `<label><input type="checkbox" name="object" value="${o.object}"/>${o.object}</label>`))
      .join('');
    objectlistDom.innerHTML = innerhtml;
  }

  function getChosenObject(){
    var all = objectlistDom.querySelectorAll(':checked');
    if(all.length > 0) {
      return Array.prototype.map.call(all, (elem) => (elem.value));
    }else{
      return false;
    }
  }

  function _downloadHandler(){
    const format = formatsDom.value;
    const data = {
      folder: modal.state.folder,
      tag: modal.state.tag,
      schema: modal.state.schema,
      form: format,
    }
    let p;
    if(p = getChosenObject()){
      const dt = Object.assign(data, {objects: p});
      const url = `/download?${toQuery(data)}`;

      var a = document.createElement('a');
      var filename = 'samples.zip';
      a.href = url;
      a.download = filename;
      a.click();
    }
   
  }


  app.downloadModal = modal;
}).call(window, app);