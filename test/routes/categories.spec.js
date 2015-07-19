var app=require('../../app');
var models = require('../../models');
var Category = models.Category;
var Promise = require('bluebird').Promise;

describe('/categories', function() {
	function wipe() {
		return Category.truncate({ cascade: true });
	};
	before(wipe);
	after(wipe);

	describe('GET /categories/', function() {

		var c1 = { caption: 'category1' };
		var c2 = { caption: 'category2' };
		var res;

		before(wipe);

		before(function populate() {
			return Promise.join(
					Category.create(c1),
					Category.create(c2))
				.then(function(created) {
					c1 = created[0].get();
					c2 = created[1].get();
				});
		});

		before(function request() {
			return chai
				.request(app)
				.get('/categories')
				.then(function(r) { res = r; });
		});

		after(wipe);

		it('should have status 200', function() {
			expect(res).to.have.status(200);
		});

		it('should respond with all categories', function() {
			expect(res.body).to.have.length(2).and.deep.include.members([ c1, c2 ]);
		});
	});

	describe('GET /categories/:id', function() {
		before(wipe);

		var category = { caption: 'category' };
		var res;

		before(function populate() {
			return Category
				.create(category)
				.then(function(created) {
					category = created;
				});
		});

		before(function request() {
			return chai
				.request(app)
				.get('/categories/' + category.id)
				.then(function(r) { res = r; });
		});

		after(wipe);

		it('should have status 200', function() {
			expect(res).to.have.status(200);
		});

		it('should respond with the right category', function() {
			expect(res.body).to.deep.equal(category.get());
		})

		it('should have status 404 on a nonexistent category', function() {
			return expect(chai
				.request(app)
				.get('/categories/' + (category.id - 1)))
				.to.eventually.have.status(404);
		});
	});

	describe('POST /categories/', function() {
		var category = { caption: 'category' };
		var res;

		before(wipe);

		before(function request() {
			return chai
				.request(app)
				.post('/categories')
				.send(category)
				.then(function(r) { res = r; });
		});

		after(wipe);

		it('should have status 201', function() {
			expect(res).to.have.status(201);
		});

		it('should set the location header', function() {
			expect(res.get('location')).to.have.match(/categories\/\d+/);
		});

		it('should create a category', function() {
			return expect(Category.findAll()).to.eventually.have.length(1);
		});
	});

	describe('PUT /categories/:id', function() {
		var category = { caption: 'category_before' };
		var changed = { caption: 'category_after' };
		var res;

		before(wipe);

		before(function populate() {
			return Category
				.create(category)
				.then(function (created) {
					category = created;
					changed.id = created.id;
				});
		});

		before(function request() {
			return chai
				.request(app)
				.put('/categories/' + category.id)
				.send(changed)
				.then(function(r) { res = r; });
		});

		after(wipe);

		it('should have status 204', function() {
			expect(res).to.have.status(204);
		});

		it('should set the location header', function() {
			expect(res).to.have.header('location', '/categories/' + category.id);
		});

		it('should update the category', function() {
			var p = Category
				.findById(changed.id)
				.then(function(category) { return category.get(); }); // Cut to values only or the deep equal will fail

			return expect(p).to.eventually.deep.equal(changed);
		});

		it('should have status 404 on a nonexistent category', function() {
			return expect(chai
				.request(app)
				.put('/categories/' + (category.id - 1))
				.send(changed))
				.to.eventually.have.status(404);

		});
	});

	describe('DELETE /categories/:id', function() {
		var category = { caption: 'category' };

		before(wipe);

		before(function populate() {
			return Category
				.create(category)
				.then(function (created) {
					category = created;
				});
		});

		before(function request() {
			return chai
				.request(app)
				.delete('/categories/' + category.id)
				.then(function(r) { res = r; });
		});

		after(wipe);

		it('should have status 204', function() {
			expect(res).to.have.status(204);
		});

		it('should delete the category', function() {
			expect(Category.findAll()).to.eventually.be.empty;
		});

		it('should have status 404 on a nonexistent category', function() {
			return expect(chai
				.request(app)
				.delete('/categories/' + (category.id - 1)))
				.to.eventually.have.status(404);

		});
	});
});