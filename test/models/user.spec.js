var models = require('../../models');
var User = models.User;
var bcrypt = require('bcryptjs');

describe('User', function() {
	const ROUNDS = 4;

	describe('#password', function() {
		it('should not allow setting the password property directly', function() {
			var user = User.build({ username:'user', email: 'test@example.com' });
			expect(function() { user.password = 'secret'}).to.throw(Error);
		});
	});

	describe('#setPassword', function() {
		it('should correctly hash the password when setting a new one', function() {
			var user = User.build({ username: 'user', email: 'test@example.com' });
			var plain = 'secret';

			var salt = bcrypt.genSaltSync(ROUNDS); // Minimum number allowed by bcrypt.js
			var hash = bcrypt.hashSync(plain, salt);

			// Making use of mocha's built-in support for promises here
			return expect(user.setPassword(plain, salt).then(function() {
				return user.password;
			})).to.eventually.equal(hash);
		});
	});

	describe('#login', function() {
		var plain = 'secret';
		var user;

		beforeEach(function() {
			user = User.build({ username: 'user', email: 'test@example.com'});
		});

		it('should reject login before activation', function() {
			user.activated = false;

			return expect(user.setPassword(plain,ROUNDS)
					.then(function() {
						return user.login(plain);
					})
			).to.eventually.be.false;
		});

		it('should allow login with correct password after activation', function() {
			user.activated = true;

			return expect(user.setPassword(plain,ROUNDS)
					.then(function() {
						return user.login(plain)
					})
			).to.eventually.be.true;
		});

		it('should reject login with an incorrect password after activation', function() {
			user.activated = true;

			return expect(user.setPassword(plain,ROUNDS)
					.then(function() {
						return user.login(plain + plain) // Double it to ensure it's different
					})
			).to.eventually.be.false;
		});
	});

	describe('#create', function() {
		var user, clock, destroy;

		beforeEach(function wipeTable() {
			return User.truncate({ cascade: true });
		});

		beforeEach(function setup() {
			clock = sinon.useFakeTimers();
		});

		beforeEach(function makeUser() {
			user = User.build({ username: 'user', email: 'test@example.com' });
			destroy = sinon.spy(user, 'destroy');
			return user
				.setPassword('secret')
				.then(user.save);
		});

		afterEach(function teardown() {
			clock.restore();
			destroy.restore();
		});

		it('should self destruct if not activated in time', function(done) {
			user.activated = false;
			user.selfDestruct.then(function() {
				expect(user.destroy).to.have.been.called;
				done();
			});
			clock.tick(User.CONFIRMATION_DEADLINE);
		});

		it('should not self destruct if activated in time', function(done) {
			user.activated = true;
			user
				.save()
				.then(function() {
					user.selfDestruct.then(function() {
						expect(user.destroy).to.not.have.been.called;
						done();
					});
					clock.tick(User.CONFIRMATION_DEADLINE);
				});
		});
	});

	describe('#confirm', function() {
		var TOKEN = 'token';

		var user;

		beforeEach(function wipeTable() {
			return User.truncate({ cascade: true });
		});

		beforeEach(function makeUser() {
			user = User.build({ username: 'user', email: 'test@example.com', activated: false, confirmationToken: TOKEN });
			return user
				.setPassword('secret')
				.then(user.save);
		});

		it('should set activated to true and delete the token', function() {
			user.confirm(TOKEN);
			expect(user.activated).to.be.true;
			expect(user.token).to.not.exist;
		});
	});
});
