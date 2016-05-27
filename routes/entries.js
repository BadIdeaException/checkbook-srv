var express = require('express');
var router = express.Router();
var models = require('../models');
var Sequelize = require('sequelize');

var Month = models.Month;
var Entry = models.Entry;

router.mountpoint = '/entries';

router.route('/')
	.get(function(req,res) {
		return Entry.findAll().then(function(entries) {
			res
				.status(200)
				.json(entries);
		});
	})

	.post(function(req,res) {
		var entry = Entry.build(req.body);
		return entry.validate().then(function(errors) {
			if (errors) return res.status(400).json(errors); // Validation failed

			return entry.save().then(function(entry) {
				return res
					.status(201)
					.location('/months/' + Month.getId(entry.datetime) + '/categories/' + entry.category + '/entries/' + entry.id)
					.json(entry);
			});
		});
	});

router.route('/:id')
	.get(function(req,res) {
		return Entry.findById(req.params.id).then(function(entry) {
			if (!entry) return res.status(404).end();
			else return res.json(entry);
		});
	})
	/*
	 * Note: req.body must in itself be a valid entry. This is to be in keeping
	 * with the semantics of PUT which replaces the identified resource
	 */
	.put(function(req,res) {
		return Entry.findById(req.params.id).then(function(entry) {
			if (!entry) return res.status(404).end();
			// Replace entry values with new ones from req.body
			Object.keys(entry.get()).forEach(function(key) {
				entry[key] = req.body[key];
			});

			// Make sure it's valid, then save
			return entry.validate().then(function(errors) {
				if (errors) return res.status(400).json(errors);

				return entry.save().then(function(entry) {
					return res
						.status(200)
						.location('/months/' + Month.getId(entry.datetime) + '/categories/' + entry.category + '/entries/' + entry.id)
						.json(entry);
				});
			});
		});
	})
	.delete(function(req,res) {
		return Entry.findById(req.params.id).then(function(entry) {
			if (!entry) return res.status(404).end();
			return entry.destroy().then(function() {
				return res.status(204).end();
			});
		});
	});

module.exports = router;