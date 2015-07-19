/**
 * Deals with the authorization infrastructure
 */

/**
 * Creates a cryptographically secure random string <code>length</code> characters long
 */
secureRandomString = function(length) {
	// Create "length" number of cryptographically strong random bytes
	var buf = require('crypto').randomBytes(length);
	// Encode in base-64 and replace /,+ and =
	buf = buf.toString('base64').replace(/\//g,'_').replace(/\+/g,'-').replace(/=/g,'!');
	// Cut back to requested length because base-64 encoding will have bloated by ~1.3
	buf = buf.substring(0,length);
	return buf;
};

/**
 * Creates a new <code>Token</code>.
 * @param {number} length - The length of the token string
 * @param {number} validity - The time in seconds until the token expires
 */
function Token(length, validity) {
	this.token = secureRandomString(length);
	this.expiration = Date.now() + validity * 1000;
}

//Token.prototype.toString = function () {
//	return this.token;
//};
Token.prototype.isValid = function () {
	return this.expiration > Date.now();
};
Token.prototype.equals = function (o) {
	return o instanceof Token && this.token === o.token;
};

/**
 * Creates a new access token.
 * Access tokens have a token length of 256 and are valid for one hour.
 */
function AccessToken() {
	Token.call(this, 256, 60*60);
//	this.token = this.generateToken(this.length);
}
AccessToken.prototype = new Token(256, 60*60);
AccessToken.prototype.constructor = AccessToken;

/**
 * Creates a new confirmation token.
 * Confirmation tokens have a token length of 1024 and are valid for one hour.
 */
function ConfirmationToken() {
	Token.call(this, 64, 60*60);
}
ConfirmationToken.prototype = new Token(64, 60*60);
ConfirmationToken.prototype.constructor = ConfirmationToken;

function RefreshToken() {
	Token.call(this, 512, 60 * 60 * 24 * 7);
}
RefreshToken.prototype = new Token(512, 60 * 60 * 24 * 7);
RefreshToken.prototype.constructor = RefreshToken;

function TokenStore() {
	var tokens = [];
	var self = this;

	/**
	 * Returns the index under which the passed token is held in this token store,
	 * if it is already present in the token store and valid, or -1 if it isn't.
	 */
	this.indexOf = function(token) {
		// If token is of type string, turn it into a new token object
		// with that string as its token string.
		if (typeof token === "string") {
			var temp = new Token(0,0);
			temp.token = token;
			token = temp;
		}
		for (var i = 0; i < tokens.length; i++) {
			if (tokens[i].equals(token)) { return i; }
		}
		return -1;
	}

	/**
	 * Returns true if this tokenstore contains the passed token and it is still valid.
	 */
	self.contains = function(token) {
		return self.indexOf(token) !== -1;
	};

	/**
	 * Adds the token to this tokenstore.
	 * @param token - The token to add. If this is not a <code>Token</code> or a
	 * descendant of it, a <code>TypeError</code> will be thrown.
	 * The token will automatically be deleted from the token store when it
	 * expires.
	 */
	self.add = function(token) {
		if (!token instanceof Token) { throw new TypeError('Parameter is not a token');	}
		// Don't add token if it already exists
		if (!self.contains(token)) {
			var lifespan = token.expiration - Date.now();
			setTimeout(function selfDestruct() {
				self.remove(token);
			}, lifespan);
			tokens.push(token);
		}
	};

	/**
	 * Removes the token from this token store.
	 */
	self.remove = function(token) {
		var i = self.indexOf(token);
		if (i !== -1) {
			tokens.splice(i, 1);
		}
	};
}

exports.AccessToken = AccessToken;
exports.RefreshToken = RefreshToken;
exports.ConfirmationToken = ConfirmationToken;
exports.TokenStore = TokenStore;
exports.Token = Token;