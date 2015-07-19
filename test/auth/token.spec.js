var auth = require('../../auth/tokens');
var Token = auth.Token;
var AccessToken = auth.AccessToken;
var RefreshToken = auth.RefreshToken;
var ConfirmationToken = auth.ConfirmationToken;

describe('Token', function() {
	var LENGTH = 10;
	var VALIDITY = 60;

	it('should correctly set length and expiration when creating', function() {
		var shouldExpire = Date.now() + VALIDITY * 1000;
		var DELTA = 20; // Allowed delta for expiration time
		var token = new Token(LENGTH, VALIDITY);
		expect(token.token).to.have.length(LENGTH);
		expect(token.expiration).to.be.within(shouldExpire - DELTA, shouldExpire + DELTA);
	});

	describe('#equals', function() {
		var a,b;

		beforeEach(function makeTokens() {
			a = new Token(LENGTH, VALIDITY);
			b = new Token(LENGTH, VALIDITY);
		});

		it('should return true if token strings are equal', function() {
			b.token = a.token;
			expect(a.equals(b)).to.be.true;
		});

		it('should return false if token strings are not equal', function() {
			expect(a.equals(b)).to.be.false;
		});

		it('should not care about validity when comparing for equality', function() {
			b = new Token(LENGTH, 0);
			expect(a.equals(b)).to.be.false;
			b.token = a.token;
			expect(a.equals(b)).to.be.true;
		});
	});

	describe('#isValid', function() {
		it('should return true before the expiration time', function() {
			var token = new Token(0, 99999);
			expect(token.isValid()).to.be.true;
		});
		it('should return false after the expiration time', function() {
			var token = new Token(0, 0);
			expect(token.isValid()).to.be.false;
		});
	});
});

describe('AccessToken', function() {
	it('should be a Token', function() {
		expect(new AccessToken()).to.be.an.instanceOf(Token);
	});
});

describe('RefreshToken', function() {
	it('should be a Token', function() {
		expect(new RefreshToken()).to.be.an.instanceOf(Token);
	});
});

describe('ConfirmationToken', function() {
	it('should be a Token', function() {
		expect(new ConfirmationToken()).to.be.an.instanceOf(Token);
	});
});

