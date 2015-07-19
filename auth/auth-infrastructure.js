var oauth2orize = require('oauth2orize');
var passport = require('passport');
var BearerStrategy = require('passport-http-bearer').Strategy;
var Issuer = require('./issuer');

var issuer = new Issuer();

var server = oauth2orize.createServer();
server.exchange(oauth2orize.exchange.password(issuer.issueFromPassword));
server.exchange(oauth2orize.exchange.refreshToken(issuer.issueFromRefreshToken));

passport.use(new BearerStrategy(function(token,done) {
	done(null, issuer.validateAccessToken(token));
}));


module.exports.server = server;
module.exports.passport = passport;
module.exports.issuer = issuer;