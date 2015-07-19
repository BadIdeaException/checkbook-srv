var Issuer = require('../../auth/issuer');
var models = require('../../models');
var User = models.User;
var RefreshToken = require('../../auth/tokens').RefreshToken;
var Promise = require('bluebird').Promise;

var CLIENT = undefined,
	USERNAME = 'user',
	PASSWORD = 'password',
	SCOPE = undefined;

describe('Issuer', function() {
	var issuer = new Issuer();

	describe('#issueFromPassword', function() {
		var user;
		var find, login;

		beforeEach(function makeUser() {
			user = User.build({ username: USERNAME, email: 'a@b.c', activated: true });
			return user.setPassword(PASSWORD);
		});

		beforeEach(function stubMethods() {
			find = sinon.stub(User, 'find');
			login = sinon.stub(User.Instance.prototype, 'login');
		});

		afterEach(function restoreMethods() {
			find.restore();
			login.restore();
		})

		it('should provide and store an access and a refresh token for correct login', function(done) {
			find.returns(Promise.resolve(user));
			login.returns(Promise.resolve(true));

			issuer.issueFromPassword(CLIENT, USERNAME, PASSWORD, SCOPE, function(err, access, refresh) {
				expect(err).to.not.exist;
				expect(access).to.exist;
				expect(issuer.accessTokens.contains(access)).to.be.true;
				expect(refresh).to.exist;
				expect(issuer.refreshTokens.contains(refresh)).to.be.true;
				done();
			});
		});

		it('should provide and store neither an access nor a refresh token for incorrect password', function(done) {
			find.returns(Promise.resolve(user));
			login.returns(Promise.resolve(false));

			issuer.issueFromPassword(CLIENT, USERNAME, PASSWORD, SCOPE, function(err, access, refresh) {
				expect(err).to.not.exist;
				expect(access).to.not.exist;
				expect(issuer.accessTokens.contains(access)).to.be.false;
				expect(refresh).to.not.exist;
				expect(issuer.refreshTokens.contains(refresh)).to.be.false;
				done();
			});
		});

		it('should provide neither an access nor a refresh token for a non-existent user', function(done) {
			find.returns(Promise.resolve(null));

			issuer.issueFromPassword(CLIENT, USERNAME, PASSWORD, SCOPE, function(err, access, refresh) {
				expect(err).to.not.exist;
				expect(access).to.not.exist;
				expect(issuer.accessTokens.contains(access)).to.be.false;
				expect(refresh).to.not.exist;
				expect(issuer.refreshTokens.contains(refresh)).to.be.false;
				done();
			});
		});
	});

	describe('#issueFromRefreshToken', function() {
		var REFRESH_TOKEN = new RefreshToken();

		it('should provide and store an access and a refresh token for correct refresh token. The used refresh token should be deleted', function(done) {
			issuer.refreshTokens.add(REFRESH_TOKEN);

			issuer.issueFromRefreshToken(CLIENT, REFRESH_TOKEN, SCOPE, function(err, access, refresh) {
				expect(err).to.not.exist;
				expect(access).to.exist;
				expect(issuer.accessTokens.contains(access)).to.be.true;
				expect(refresh).to.exist;
				expect(issuer.refreshTokens.contains(refresh)).to.be.true;
				expect(issuer.refreshTokens.contains(REFRESH_TOKEN)).to.be.false;
				done();
			});
		});

		it('should provide and store neither an access nor a refresh token for incorrect refresh token. The existing refresh token should not be deleted', function(done) {
			issuer.refreshTokens.add(REFRESH_TOKEN);

			issuer.issueFromRefreshToken(CLIENT, new RefreshToken(), SCOPE, function(err, access, refresh) {
				expect(err).to.not.exist;
				expect(access).to.not.exist;
				expect(issuer.accessTokens.contains(access)).to.be.false;
				expect(refresh).to.not.exist;
				expect(issuer.refreshTokens.contains(refresh)).to.be.false;
				expect(issuer.refreshTokens.contains(REFRESH_TOKEN)).to.be.true;
				done();
			});
		});
	})
});