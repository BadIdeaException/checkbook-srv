var app=require('../../app');
var models = require('../../models');
var Category = models.Category;
var Entry = models.Entry;
var Month = models.Month;
var Promise = require('bluebird').Promise;

describe('/months', function() {
	var category = { caption: 'category' };
	entry1 = {
			caption : 'entry1',
			value : -100,
			datetime : '2014-12-18T17:33:00.000',
			category : undefined,
			details : 'details1'
		};
		entry2 = {
			caption : 'entry2',
			value : +200,
			datetime : '2015-01-24T18:19:00.000',
			category : undefined,
			details : 'details2'
		};
		entry3 = {
			caption : 'entry3',
			value : -100,
			datetime : '2015-01-24T14:24:00.000',
			category : undefined,
			details : 'details3'
		};

	function populate() {
		return Category
			.create()
			.then(function(created) {
				category = created;
				[ entry1, entry2, entry3 ].forEach(function(entry) { entry.category = category.id });
				return Promise.join(
						Entry.create(entry1),
						Entry.create(entry2),
						Entry.create(entry3));
			});
	};

	function wipe() {
		return models.sequelize.truncate({ cascade: true });
	}

	before(wipe);
	before(populate);
	after(wipe);

	describe('GET /months', function() {
		var res;

		before(function request() {
			return chai
				.request(app)
				.get('/months')
				.then(function(r) { res = r; });
		});

		it('should have status 200', function() {
			expect(res).to.have.status(200);
		});

		it('should respond with the months', function() {
			var month1 = Month.build({ id: Month.getId(entry1.datetime), value: -100 });
			var month2 = Month.build({ id: Month.getId(entry2.datetime), value: 100 });
			expect(res.body).have.length(2).and.deep.include.members([ month1.get(), month2.get() ]);
		})
	});

	describe('GET months/:id', function() {
		var res;
		var month = Month.build({ id: Month.getId(entry1.datetime), value: -100 });

		before(function request() {
			return chai
				.request(app)
				.get('/months/' + month.id)
				.then(function(r) { res = r; });
		});

		it('should have status 200', function() {
			expect(res).to.have.status(200);
		});

		it('should respond with the requested month', function() {
			expect(res.body).to.deep.equal(month.get());
		});

		it('should have status 404 on a non-existent month', function() {
			var p = chai
				.request(app)
				.get('/months/1');

			expect(p).to.eventually.have.status(404);
		});
	});
});