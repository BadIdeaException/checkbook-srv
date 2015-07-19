var tokens = require('../../auth/tokens');
var Token = tokens.Token;
var TokenStore = tokens.TokenStore;

describe('TokenStore', function() {
	var LENGTH = 10;
	var VALIDITY = 3600;
	var token, store;

	beforeEach(function() {
		token = new tokens.Token(LENGTH, VALIDITY);
		store = new TokenStore();
	});

	it('should not contain a token that wasn\'t added', function() {
		expect(store.contains(token)).to.be.false;
		// Check that it also handles calls with a token string
		// instead of a token object correctly
		expect(store.contains(token.token)).to.be.false;
	});

	it('should contain a token after it was added', function() {
		store.add(token);
		// Check that it also handles calls with a token string
		// instead of a token object correctly
		expect(store.contains(token)).to.be.true;
		expect(store.contains(token.token)).to.be.true;
	});

	it('should not contain a token after it was removed', function() {
		var token = new tokens.Token(1,1);
		var store = new tokens.TokenStore();
		store.add(token);
		store.remove(token);
		expect(store.contains(token)).to.be.false;
	});

	it('should automatically remove tokens when they expire', function(done) {
		var clock = sinon.useFakeTimers(Date.now());
		// Make token expire after 1 second
		store.add(token);
		process.nextTick(function() {
			expect(store.contains(token)).to.be.false;
			done();
		});
		clock.tick(VALIDITY * 1000);
		clock.restore();
	});
});