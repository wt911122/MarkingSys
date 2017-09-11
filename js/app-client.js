var app = this.app || {};
(function(app){
	const wsUrl = "ws://localhost:10086";
	console.log(app);
	app.init = function(){
		app.websocket.init(wsUrl);
		app.dom.init({
			fileListDom: document.getElementById("list"), 
			tagListDom: document.getElementById("taglist"), 
			objectListDom: document.getElementById("objectlist"),
			folderListDom: document.getElementById("folders"),
			strategyListDom: document.getElementById("strategyList"),
			classesDom: document.getElementById("classesDom"), 
			imagepart: document.getElementById("markzone"), 
			saveBtn: document.getElementById("savebtn"), 
			sweepBtn: document.getElementById("sweepbtn"), 
			downloadBtn: document.getElementById("downloadBtn"),
			newSchemaBtn: document.getElementById("newSchemaBtn"),
		});
		app.mark.init(document.getElementById("markzone"));
		app.downloadModal.init();
		app.schemaModel.init();
	}
	app.init();
}).call(window, app);