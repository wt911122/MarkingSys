var app = this.app || {};

(function(app){
	const wsUrl = "ws://10.1.1.168:10086";
	console.log(app);
	app.init = function(){
		app.websocket.init(wsUrl);
		app.dom.init(
			document.getElementById("list"), 
			document.getElementById("classesDom"),
			document.getElementById("imagepart"),
			document.getElementById("savebtn"),
			document.getElementById("sweepbtn"));
	}
	app.init();
}).call(window, app);