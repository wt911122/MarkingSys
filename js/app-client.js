var app = this.app || {};

(function(app){
	const wsUrl = "ws://localhost:10086";
	console.log(app);
	app.init = function(){
		app.websocket.init(wsUrl);
		app.dom.init(
			document.getElementById("list"), 
			document.getElementById("classesDom"),
			document.getElementById("imagepart"),
			document.getElementById("canvas"));
	}
	app.init();
}).call(window, app);