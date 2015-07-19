var app=require('../../app');
var models = require('../../models');
var Category = models.Category;
var Entry = models.Entry;
var Month = models.Month;
var Promise = require('bluebird').Promise;

describe('/months/:month/categories', function() {
	var category1 = { caption: 'category1' },
		category2 = { caption: 'category2' };

	var entry1 = {
			caption : 'entry1',
			value : -100,
			datetime : '2015-01-18T17:33:00.000',
			category : undefined,
			details : 'details1'
		},
		entry2 = {
			caption : 'entry2',
			value : +200,
			datetime : '2015-01-24T18:19:00.000',
			category : undefined,
			details : 'details2'
		},
		entry3 = {
			caption : 'entry3',
			value : -100,
			datetime : '2015-01-24T14:24:00.000',
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

				return Promise.join(Entry.create(entry1), Entry.create(entry2), Entry.create(entry3));
			});
	}

	before(wipe);
	before(populate);
	after(wipe);

	describe('GET /months/:month/categories', function() {
		var res;

		before(function request() {
			return chai
				.request(app)
				.get('/months/' + monthid + '/categories')
				.then(function(r) { res = r; });
		});

		it('should have status 200', function() {
			expect(res).to.have.status(200);
		});

		it('should respond with the categories for the requested month', function() {
			var c1 = category1; c1.value = -100;
			var c2 = category2; c2.value = +100;

			expect(res.body).to.deep.equal([ c1, c2 ]);
		});
	});

	describe('GET /months/:month/categories/:category', function() {
		var res;

		before(function request() {
			return chai
				.request(app)
				.get('/months/' + monthid + '/categories/' + category1.id)
				.then(function(r) { res = r; });
		});

		it('should have status 200', function() {
			expect(res).to.have.status(200);
		});

		it('should respond with the requested category for the requested month', function() {
			var category = category1; category.value = -100;
			expect(res.body).to.deep.equal(category);
		});

		it('should have status 404 for a non-existent category', function() {
			var p = chai
				.request(app)
				.get('/months/' + monthid + '/categories/' + (category1.id - 1));

			expect(p).to.eventually.have.status(404);
		});
	});
});