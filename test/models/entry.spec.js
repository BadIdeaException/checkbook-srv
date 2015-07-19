var models = require('../../models');
var Category = models.Category;
var Entry = models.Entry;
var Promise = require('bluebird').Promise;

describe('Entry', function() {
	var category;

	function wipe() { return Promise.join(Category.truncate({ cascade: true }), Entry.truncate({ cascade: true })); }
	function populate() {
		return Category.create(category).then(function(created) { category = created; });
	}

	before(wipe);
	before(populate);
	after(wipe);

	it('should have the same timestamp when read from the db as when written', function() {
		var datetime = new Date(Date.now());
		datetime.setMilliseconds(0);

		var entry = {
			caption: 'entry',
			value: -100,
			datetime: datetime,
			category: category.id,
			details: ''
		};

		return expect(Entry
			.create(entry)
			.then(function(entry) { return Entry.findById(entry.id); })
			.then(function(entry) { return entry.datetime.getTime(); }))
			.to.eventually.equal(entry.datetime.getTime());
	});
})