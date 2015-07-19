var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var basename = path.basename(module.filename);

/**
 * Read *.js (except this file) from the folder and mount it as router using
 * either the .mountpoint property, or if none exists, the filename as the mount point
 */

fs.readdirSync(__dirname)
	.filter(function(file) {
		// Restrict to .js files and filter out this file
		return (file !== basename && file.indexOf('.js') !== 0);
	})
	.forEach(function(file) {
		var controller = require('./' + file);
		// If a mountpoint property is not set on the route, use the filename
		if (!controller.mountpoint) controller.mountpoint = path.basename(file, '.js');
		// Prepend leading slash if not present
		if (controller.mountpoint[0] !== '/') controller.mountpoint = '/' + controller.mountpoint;
		// Mount controller at mount point
		router.use(controller.mountpoint, controller);
	});

module.exports = router;
