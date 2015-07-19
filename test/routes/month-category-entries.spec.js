var app=require('../../app');
var models = require('../../models');
var Category = models.Category;
var Entry = models.Entry;
var Month = models.Month;
var Promise = require('bluebird').Promise;

describe('/months/:month/categories/:category/entries', function() {

	var category1 = { caption: 'category1' },
		category2 = { caption: 'category2' };

	var entry1 = {
			caption : 'entry1',
			value : -100,
			datetime : new Date('2015-01-18T17:33:00.000Z'),
			category : undefined,
			details : 'details1'
		},
		entry2 = {
			caption : 'entry2',
			value : +200,
			datetime : new Date('2015-01-24T18:19:00.000Z'),
			category : undefined,
			details : 'details2'
		},
		entry3 = {
			caption : 'entry3',
			value : -100,
			datetime : new Date('2015-01-24T14:24:00.000Z'),
			category : undefined,
			details : 'details3'
		};
	var monthid = Month.getId(entry1.datetime);

	function wipe() {
		return models.sequelize.truncate({ cascade: true });
	}

	function populate() {
		return Promise
			.join(Category.create(category1), Category.create(category2))
			.then(function(created) {
				category1 = created[0].get();
				category2 = created[1].get();
				entry1.category = category1.id;
				entry2.category = entry3.category = category2.id;

				return Promise
					.join(Entry.create(entry1), Entry.create(entry2), Entry.create(entry3))
					.spread(function(e1, e2, e3) {
						entry1 = e1.get();
						entry2 = e2.get();
						entry3 = e3.get();
					});
			});
	}

	before(wipe);
	before(populate);
	after(wipe);

	// Helper function to make sure the deep equality checks aren't tripped
	// by different date representations
	function normalizeDate(entry) {
		entry.datetime = new Date(entry.datetime).toISOString();
		return entry;
	}

	describe('GET /months/:month/categories/:category/entries', function() {
		var res;

		before(function request() {
			return chai
				.request(app)
				.get('/months/' + monthid + '/categories/' + category2.id + '/entries')
				.then(function(r) { res = r; });
		});

		it('should have status 200', function() {
			expect(res).to.have.status(200);
		});

		it('should respond with all entries for the requested month and category', function() {

			expect(res.body.map(normalizeDate)).to.have.length(2)
				.and.deep.include.members([ entry2, entry3 ].map(normalizeDate));
		});
	});

	describe('GET /months/:month/categories/:category/entries/:entry', function() {
		var res;

		before(function request() {
			return chai
				.request(app)
				.get('/months/' + monthid + '/categories/' + category2.id + '/entries/' + entry2.id)
				.then(function(r) { res = r; });
		});

		it('should have status 200', function() {
			expect(res).to.have.status(200);
		});

		it('should respond with the requested entry for the requested month and category', function() {
			expect(normalizeDate(res.body)).to.deep.equal(normalizeDate(entry2));
		});

		it('should have status 404 on a non-existent entry', function() {
			expect(chai
					.request(app)
					.get('/months/' + monthid + '/categories/' + category2.id + '/entries/' + entry1.id)) // entry1 is in category1
			.to.eventually.have.status(404);
		});
	});

	describe('POST /months/:month/categories/:category/entries', function() {
		var res;
		var newEntry = {
				caption : 'new entry',
				value : -200,
				datetime : new Date('2015-01-22T17:33:00.000Z'),
				category : undefined,
				details : 'new details'
		};

		before(function completeEntry() {
			newEntry.category = category1.id;
		});

		before(function request() {
			return chai
				.request(app)
				.post('/months/' + monthid + '/categories/' + newEntry.category + '/entries')
				.send(newEntry)
				.then(function(r) { res = r; });
		});

		it('should have status 201', function() {
			expect(res).to.have.status(201);
		});

		it('should set the location header', function() {
			var url = '/months/' + monthid + '/categories/' + newEntry.category + '/entries';
			expect(res.get('location')).to.match(new RegExp(url + '/\\d+'));
		});

		it('should create the entry', function() {
			return expect(Entry.find({ where: { caption: newEntry.caption, details: newEntry.details }}))
				.to.eventually.exist;
		});

		it('should have status 400 if month from route does not match datetime', function() {
			return expect(chai
				.request(app)
				.post('/months/' + (monthid - 1) + '/categories/' + newEntry.category + '/entries')
				.send(newEntry))
				.to.eventually.have.status(400);
		});

		it('should have status 400 if category from route does not match category from body', function() {
			return expect(chai
				.request(app)
				.post('/months/' + monthid + '/categories/' + (newEntry.category - 1) + '/entries')
				.send(newEntry))
				.to.eventually.have.status(400);
		});

		it('should have status 400 if body is not a valid entry', function() {
			return expect(chai
				.request(app)
				.post('/months/' + monthid + '/categories/' + newEntry.category + '/entries')
				.send({}))
				.to.eventually.have.status(400);
		});
	});

	describe('PUT /months/:month/categories/:category/entries/:entry', function() {
		var res;
		var changed = {
				caption : 'changed entry',
				value : -200,
				datetime : new Date('2014-12-22T17:33:00.000Z'),
				category : undefined,
				details : 'changed details'
		};

		before(function completeEntry() {
			changed.id = entry1.id;
			changed.category = category2.id;
		});

		before(function request() {
			return chai
				.request(app)
				.put('/months/' + monthid + '/categories/' + entry1.category + '/entries/' + entry1.id)
				.send(changed)
				.then(function(r) { res = r; });
		});

		it('should have status 204', function() {
			expect(res).to.have.status(204);
		});

		it('should set the location header', function() {
			var location = '/months/' + Month.getId(changed.datetime) + '/categories/' + changed.category + '/entries/' + changed.id;
			expect(res.get('location')).to.equal(location);
		});

		it('should update the entry', function() {
			return expect(Entry.findById(changed.id).then(function (entry) { return entry.get(); })).to.eventually.deep.equal(changed);
		});

		it('should have status 404 for a non-existent entry', function() {
			return expect(chai
				.request(app)
				.put('/months/' + monthid + '/categories/' + category1.id + '/entries/' + entry2.id) // entry2 is actually in category2
				.send(changed))
				.to.eventually.have.status(404);
		});

		it('should have status 400 if body is not a valid entry', function() {
			return expect(chai
				.request(app)
				.put('/months/' + monthid + '/categories/' + entry2.category + '/entries/' + entry2.id)
				.send({}))
				.to.eventually.have.status(400);
		});
	});

	describe('DELETE /months/:month/categories/:category/entries/:entry', function() {
		var res;

		before(function request() {
			return chai
				.request(app)
				.delete('/months/' + Month.getId(entry2.datetime) + '/categories/' + entry2.category + '/entries/' + entry2.id)
				.then(function(r) { res = r; });
		});

		it('should have status 204', function() {
			expect(res).to.have.status(204);
		});

		it('should delete the entry', function() {
			return expect(Entry.findById(entry2.id)).to.eventually.not.exist;
		});

		it('should have status 404 on a non-existent entry', function() {
			return expect(chai
				.request(app)
				.delete('/months/' + monthid + '/categories/' + category1.id + '/entries/' + entry3.id)) // entry3 is actually in category2
				.to.eventually.have.status(404);
		});
	});
});