var models = require('../../models');
var User = models.User;
var receptionist = require('../../util/receptionist');
var Promise = require('bluebird').Promise;

describe('Receptionist', function() {
	describe('#register', function() {
		var user;
		var save, create, sendMail;

		beforeEach(function makeUser() {
			user = User.build({ username: 'user', email: 'a@b.c' });
			return user.setPassword('secret');
		});

		beforeEach(function stubMethods() {
			save =  sinon.stub(user, 'save').returns(Promise.resolve(user));
			create = sinon.stub(User, 'create').returns();
			sendMail = sinon.spy(receptionist.mailer, 'sendMail');
		});

		afterEach(function restoreMethods() {
			save.restore();
			create.restore();
			sendMail.restore();
		});

		it('should throw if parameter is not a user', function() {
			expect(receptionist.register.bind(receptionist,null)).to.throw(TypeError);
		});

		it('should create a user record', function() {
			return expect(receptionist.register(user), 'expected user.save or User.create to have been called').to.eventually.satisfy(function() {
				return save.called || create.called;
			});
		});

		it('should create a confirmation token for the user', function() {
			return expect(receptionist.register(user).then(function(results) {
				return results.user.confirmationToken;
			})).to.eventually.exist;
		});

		it('should send a mail containing the confirmation link to the user', function(done) {
			receptionist.register(user).then(function() {
				// Make sure it's been called
				expect(sendMail).to.have.been.called;
				// And that the mail was sent to the right address
				expect(sendMail.getCall(0).args[0].to).to.equal(user.email);
				// And that it has the right token link
				expect(sendMail.getCall(0).args[0].text).to.contain(user.confirmationToken);
				done();
			});
		});

		it('should reject the promise if the username is already taken', function() {
			var user2 = User.build({ username: user.username, email: user.email });
			var p = user2
				.setPassword('secret')
				.then(function() {
					return user2.save();
				})
				.then(function() {
					return receptionist.register(user);
				})
				.then(function() {
					return receptionist.register(user2);
				});

			return expect(p).to.eventually.be.rejected;
		});
	});

	describe('#readmit', function() {
		var user;
		var save, create, sendMail;

		beforeEach(function makeUser() {
			user = User.build({ username: 'user', email: 'a@b.c' });
			return user.setPassword('secret');
		});

		beforeEach(function stubMethods() {
			save =  sinon.stub(user, 'save').returns(Promise.resolve(user));
			create = sinon.stub(User, 'create').returns();
			sendMail = sinon.spy(receptionist.mailer, 'sendMail');
		});

		afterEach(function restoreMethods() {
			save.restore();
			create.restore();
			sendMail.restore();
		});

		it('should throw if parameter is not a user', function() {
			expect(receptionist.readmit.bind(receptionist,null)).to.throw(TypeError);
		});

		it('should set a confirmation token on the user', function() {
			return expect(receptionist.readmit(user).then(function(results) {
				return results.user.confirmationToken;
			})).to.eventually.exist;
		});

		it('should leave user.activated unchanged', function() {
			activated = user.activated;
			return expect(receptionist.readmit(user).then(function(results) {
				return results.user.activated;
			})).to.eventually.equal(activated);
		});

		it('should save the user', function() {
			return expect(receptionist.readmit(user)).to.eventually.satisfy(function() {
				return save.called;
			});
		});

		it('should send a readmittance email containing the confirmation link to the user', function() {
			return expect(receptionist.readmit(user)).to.eventually.satisfy(function() {
				// Make sure it's been called
				return sendMail.called
						// And that the mail was sent to the right address
						&& sendMail.getCall(0).args[0].to === user.email
						// And that it has the right token link
						sendMail.getCall(0).args[0].text.indexOf(user.confirmationToken) !== -1;
			})
		});
	});

	describe('#confirm', function() {
		var user;
		var save;

		beforeEach(function makeUser() {
			user = User.build({ username: 'user', email: 'a@b.c' });
		});

		beforeEach(function stubMethods() {
			save =  sinon.stub(user, 'save').returns(Promise.resolve(user));
		});

		beforeEach(function register() {
			return receptionist.register(user);
		});

		afterEach(function restoreMethods() {
			save.restore();
		});

		it('should throw if first parameter is not a user', function() {
			expect(receptionist.confirm.bind(receptionist,null,user.confirmationToken)).to.throw(TypeError);
		});

		it('should throw if second parameter is not a string', function() {
			expect(receptionist.confirm.bind(receptionist,user,null)).to.throw(TypeError);
		});

		it('should resolve to true if the token was correct', function() {
			return expect(receptionist.confirm(user, user.confirmationToken)).to.eventually.be.true;
		});

		it('should save the user if confirmation was successful', function() {
			return expect(receptionist.confirm(user, user.confirmationToken)).to.eventually.satisfy(function saveCalled() {
				return save.called;
			});
		});

		it('should resolve to false if the token was incorrect', function() {
			return expect(receptionist.confirm(user, user.confirmationToken + user.confirmationToken)).to.eventually.be.false;
		})
	});
});