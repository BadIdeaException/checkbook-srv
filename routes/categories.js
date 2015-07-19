var express = require('express');
var router = express.Router();
var models = require('../models');
var Category = models.Category;
var url = require('url');

router.mountpoint = '/categories';

router.route('/')
	.get(function(req,res) {
		return Category.findAll().then(function(categories) {
			res
				.status(200)
				.json(categories);
		});
	})
	.post(function(req,res) {
		return Category.create(req.body).then(function(category) {
			res
				.status(201)
				.location(router.mountpoint + '/' + category.id)
				.end();
		});
	});

router.route('/:id')
	.get(function(req,res) {
		return Category.findById(req.params.id).then(function(category) {
			if (!category) res.status(404).end();
			else res.status(200).json(category);
		});
	})
	.put(function(req,res) {
		return Category.findById(req.params.id).then(function(category) {
			if (!category) return res.status(404).end();
			for (var key in req.body) {
				category[key] = req.body[key];
				return category.save().then(function() {
					res
						.status(204)
						.location(router.mountpoint + '/' + category.id)
						.end();
				});
			}
		});
	})
	.delete(function(req,res) {
		Category.findById(req.params.id).then(function(category) {
			if (!category) res.status(404).end();
			else return category.destroy().then(function() {
				res.status(204).end();
			})
		});
	});

module.exports = router;