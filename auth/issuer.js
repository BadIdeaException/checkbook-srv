var tokens = require('./tokens');
var AccessToken = tokens.AccessToken;
var RefreshToken = tokens.RefreshToken;
var TokenStore = tokens.TokenStore;
var models = require('../models');
var User = models.User;

function Issuer() {
	var self = this;

	self.accessTokens = new TokenStore();
	self.refreshTokens = new TokenStore();

	self.issueFromPassword = function(client, username, password, scope, done) {
		User
			.find(username)
			.then(function(user) {
				// If no user was found at all prepare no tokens
				if (!user) return null;
				// Try to login found user
				return user
					.login(password)
					.then(function(success) {
						// If login was unsuccessful prepare no tokens
						if (!success) return null;
						// If login was successful prepare tokens and pass to the next chained promise
						return {
							access: new AccessToken(),
							refresh: new RefreshToken()
						};
					});
			})
			// This handler invokes the callback with the prepared tokens, if any
			.then(function(tokens) {
				if (tokens) {
					self.accessTokens.add(tokens.access);
					self.refreshTokens.add(tokens.refresh);
					done(null, tokens.access.token, tokens.refresh.token);
				} else done(null);
			})
			.catch(done); // If promise was rejected promote error
	};

	self.issueFromRefreshToken = function(client, refreshToken, scope, done) {
		if (self.refreshTokens.contains(refreshToken)) {
			// Revoke the refresh token that was just used
			self.refreshTokens.remove(refreshToken);
			// Generate a new set of tokens
			var access = new tokens.AccessToken();
			var refresh = new tokens.RefreshToken();
			// Store tokens
			self.accessTokens.add(access);
			self.refreshTokens.add(refresh);
			// Issue tokens to client
			done(null, access.token, refresh.token);
		} else {
			// Used an invalid refresh token => invalid_grant error
			done(null);
		}
	};

	self.validateAccessToken = function(token) {
		return self.accessTokens.contains(token);
	};

	self.validateRefreshToken = function(token) {
		return self.refreshTokens.contains(token);
	}
}

module.exports = Issuer;