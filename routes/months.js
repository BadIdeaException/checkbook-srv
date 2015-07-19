var express = require('express');
var router = express.Router();
var models = require('../models');
var Month = models.Month;

router.mountpoint = 'months';

router.route('/')
	.get(function(req,res) {
		Month.findAll().then(function(months) {
			res.status(200).json(months);
		});
	});

router.route('/:id')
	.get(function(req,res) {
		Month.findById(req.params.id).then(function(month) {
			if (!month) res.status(404).end();
			else res.status(200).json(month);
		});
	});

module.exports = router;