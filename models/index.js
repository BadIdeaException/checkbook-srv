"use strict";

var fs        = require("fs");
var path      = require("path");
var Sequelize = require("sequelize");
var basename  = path.basename(module.filename);
var env       = process.env.NODE_ENV;
var dbconfig  = require(__dirname + '/../config/database.json')[env];
var sequelize = new Sequelize(dbconfig.database, dbconfig.username, dbconfig.password, dbconfig);
var db        = {};

// Adjust timestamps from the db so that JavaScript's Date constructor doesn't interpret them
// as local time.
// Workaround until entries.datetime column can be set to TIMESTAMP(0) WITH TIME ZONE (breaking change).
require('pg').types.setTypeParser(1114, function(stringValue) {
	return new Date(stringValue.substring(0, 10) + 'T' + stringValue.substring(11) + '.000Z');
});

fs
	.readdirSync(__dirname)
	.filter(function(file) {
		return (file.indexOf(".") !== 0) && (file !== basename);
	})
	.forEach(function(file) {
		var model;
		// Sequelize models are called *.seq.js
		if (file.indexOf('.seq') !== -1)
			var model = sequelize["import"](path.join(__dirname, file))
		else {
			model = require(path.join(__dirname, file));
			model.name = model.name || path.basename(file, '.js');
		}
		db[model.name] = model;
	});

Object.keys(db).forEach(function(modelName) {
	if ("associate" in db[modelName]) {
		db[modelName].associate(db);
	}
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;