var express = require('express');
var router = express.Router();
var models = require('../models');
var Promise = require('bluebird');

var Month = models.Month;
var Entry = models.Entry;
var Category = models.Category;

router.mountpoint = '/months';

router.route('/:month/categories')
	.get(function(req,res) {
		var month = Month.build({ id: req.params.month, value: 0 });
		return Promise
			.join(Category.findAll(), month.getEntries())
			.spread(function(_categories, entries) {
				// Convert categories to hash and initalize values to 0
				var categories = {};
				_categories.forEach(function(category) {
					categories[category.id] = category.get();
					categories[category.id].value = 0;
				});

				// Sum up category values for all entries
				entries.forEach(function(entry) {
					categories[entry.category].value += entry.value;
				});

				// Flatten hash to array
				categories = Object.keys(categories).map(function flatten(key) { return categories[key]; });
				return res.status(200).json(categories);
			});

//		return month.getEntries().then(function(entries) {
//			var categories = {};
//			for (var i = 0; i < entries.length; i++) {
//				var entry = entries[i];
//				if (!categories[entry.category]) {
//					categories[entry.category] = entry.getCategory();
//				}
//			}
//			// Run this when all categories are loaded:
//			Promise.props(categories).then(function(promises) {
//				var result = {};
//				for (var i = 0; i < entries.length; i++) {
//					var entry = entries[i];
//					var key = entry.category;
//					// If category already present in result, add the entry's value
//					// Otherwise enter the category into the result and set the value
//					if (result[key]) {
//						result[key].value += entry.value;
//					} else {
//						result[key] = promises[key].values;
//						result[key].value = entry.value;
//					}
//				}
//				// Flatten hash to array and send
//				res.json(Object.keys(result).map(function flatten(key) {
//					return result[key];
//				}));
//			});
//		});
	});

router.route('/:month/categories/:id')
	.get(function(req,res) {
		var month = Month.build({ id: req.params.month, value: 0 });
		return month.getEntries({ where: { category: req.params.id }}).then(function(entries) {
			return Category.findById(req.params.id).then(function(category) {
				if (!category) return res.status(404).end();

				category = category.get();

				category.value = entries.reduce(function(total, entry) {
					console.log(entry.value);
					return total + entry.value;

				}, 0);

				res.json(category);
			});
		});
	});

module.exports = router;