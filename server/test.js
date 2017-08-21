var fs = require('fs')
  , gm = require('gm').subClass({imageMagick: true});



gm('../source/left143.jpg')
	.crop(300, 300, 150, 130)
	.noProfile()
	.write('./resize.png', function (err) {
		if (!err) console.log('done');
	});
