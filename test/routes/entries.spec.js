var app=require('../../app');
var models = require('../../models');
var Entry = models.Entry;
var Promise = require('bluebird').Promise;

describe('/entries', function() {
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

	function wipe() {
		return models.sequelize.truncate({ cascade: true });
	}

	function populate() {
		var Category = models.Category;
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

	describe('GET /entries', function() {
		var res;

		before(function request() {
			return chai
				.request(app)
				.get('/entries')
				.then(function(r) { res = r; });
		});

		it('should have status 200', function() {
			expect(res).to.have.status(200);
		});

		it('should respond with all entries', function() {

			expect(res.body.map(normalizeDate)).to.have.length(3)
				.and.deep.include.members([ entry1, entry2, entry3 ].map(normalizeDate));
		});
	});

	describe('GET /entries/:entry', function() {
		var res;

		before(function request() {
			return chai
				.request(app)
				.get('/entries/' + entry2.id)
				.then(function(r) { res = r; });
		});

		it('should have status 200', function() {
			expect(res).to.have.status(200);
		});

		it('should respond with the requested entry', function() {
			expect(normalizeDate(res.body)).to.deep.equal(normalizeDate(entry2));
		});

		it('should have status 404 on a non-existent entry', function() {
			var nonexistent = entry1.id + entry2.id + entry3.id;
			expect(chai
					.request(app)
					.get('/entries/' + nonexistent))
			.to.eventually.have.status(404);
		});
	});

	describe('POST /entries', function() {
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
				.post('/entries')
				.send(newEntry)
				.then(function(r) { res = r; });
		});

		it('should have status 201', function() {
			expect(res).to.have.status(201);
		});

		it('should set the location header', function() {
			var url = '/months/' + models.Month.getId(newEntry.datetime) + '/categories/' + newEntry.category + '/entries';
			expect(res.get('location')).to.match(new RegExp(url + '/\\d+'));
		});

		it('should create the entry', function() {
			return expect(Entry.find({ where: { caption: newEntry.caption, details: newEntry.details }}))
				.to.eventually.exist;
		});

		it('should have status 400 if body is not a valid entry', function() {
			return expect(chai
				.request(app)
				.post('/entries')
				.send({}))
				.to.eventually.have.status(400);
		});
	});

	describe('PUT /entries/:entry', function() {
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
				.put('/entries/' + entry1.id)
				.send(changed)
				.then(function(r) { res = r; });
		});

		it('should have status 204', function() {
			expect(res).to.have.status(204);
		});

		it('should set the location header', function() {
			var location = '/months/' + models.Month.getId(changed.datetime) + '/categories/' + changed.category + '/entries/' + changed.id;
			expect(res.get('location')).to.equal(location);
		});

		it('should update the entry', function() {
			return expect(Entry.findById(changed.id).then(function (entry) { return entry.get(); })).to.eventually.deep.equal(changed);
		});

		it('should have status 404 for a non-existent entry', function() {
			var nonexistent = entry1.id + entry2.id + entry3.id;
			return expect(chai
				.request(app)
				.put('/entries/' + nonexistent)
				.send(changed))
				.to.eventually.have.status(404);
		});

		it('should have status 400 if body is not a valid entry', function() {
			return expect(chai
				.request(app)
				.put('/entries/' + entry2.id)
				.send({}))
				.to.eventually.have.status(400);
		});
	});

	describe('DELETE /entries/:entry', function() {
		var res;

		before(function request() {
			return chai
				.request(app)
				.delete('/entries/' + entry2.id)
				.then(function(r) { res = r; });
		});

		it('should have status 204', function() {
			expect(res).to.have.status(204);
		});

		it('should delete the entry', function() {
			return expect(Entry.findById(entry2.id)).to.eventually.not.exist;
		});

		it('should have status 404 on a non-existent entry', function() {
			var nonexistent = entry1.id + entry2.id + entry3.id;
			return expect(chai
				.request(app)
				.delete('/entries/' + nonexistent)) // entry3 is actually in category2
				.to.eventually.have.status(404);
		});
	});

});