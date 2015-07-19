var url = require('url');
var passport = require('./auth-infrastructure').passport;

/**
 * Turns the provided whitelist into an array of regular expressions of the form
 * ^path$ where path is the corresponding entry in the passed whitelist, with
 * - all * globs replaced by [A-Za-z0-9%\-\._]*
 * - all ** globs replaced by (?:[A-Za-z0-9%\-\._]+\/?)*
 *
 * @param whitelist {array} - Array of paths to be whitelisted
 * @returns {Array} An array of corresponding regular expressions
 */
function regex(whitelist) {
	var ALLOWED_CHARS = 'A-Za-z0-9%\\-\\._';

	// A single dir glob (*) is any of the allowed chars, repeated any number of times
	// (This does not include the slash character)
	var SINGLE_DIR_GLOB = '[' + ALLOWED_CHARS + ']#'; // use # instead of * for the moment

	// A multi dir glob (**) is, conceptually, a possibly empty succession of subpaths, followed
	// by a single dir glob.
	// The negative lookahead (?!/) at the start of the regex is there to prevent the multi dir
	// glob collapsing into an empty sequence and producing a double slash when the next character
	// in the input whitelist is a slash.
	// I.e. on a whitelist entry such as /**/*.html, without the lookahead, the ** might collapse
	// into an empty sequence, allowing paths such as //a.html to match
	var MULTI_DIR_GLOB = '(?!\\/)(?:[' + ALLOWED_CHARS + ']+\\/)#' + SINGLE_DIR_GLOB; // use # instead of * for the moment

	if (!Array.isArray(whitelist)) throw new TypeError('Whitelist is not an array');
	// Make sure whitelist contains only valid paths
	whitelist.forEach(function (path) {
		// - A path can either be /, or a non-empty succession of subpaths
		// - A subpath can either be **, or *, or a succession of leading asterisk sequences, or a succession of trailing asterisk sequences
		// - A leading asterisk sequence is an optional *, followed by a non-empty succession of allowed characters
		// - A trailing asterisk sequence is a non-empty succession of allowed characters, followed by an optional *
		// - Allowed characters are A-Z, a-z, 0-9, $, -, .
		//
		// The following grammar applies (since the EBNF notation does not have a symbol for non-optional repetition,
		// i.e. repeated at least once or more, we will use {{x}} to denote x,{x})
		// path = "/" | {{"/",subpath}}
		// subpath = "**" | "*" | {{leading}} | {{trailing}}
		// leading = ["*"],{{allowed}}
		// trailing = {{allowed}},["*"]
		// allowed = "A" | "B" | ... | "Z" | "a" | ... | "z" | "0" | ... | "9" | "%" | "-" | "."
//		if (path.search(/^(\/|(\/(\*\*|\*|([a-z0-9%\-\._]+\*?)+|(\*?[a-z0-9%\-\._]+)+))+)$/gi) === -1)
//			throw new SyntaxError('Syntax error on whitelist entry ' + path);
		// Perform some syntax correctness checks on the whitelist
		// Check that only allowed characters occur, plus the slash and the asterisk
		if (path.search(new RegExp('[^' + ALLOWED_CHARS + '/*]', 'gi')) !== -1||
			// Check that no more than two asterisks occur successively
			path.search(/\*{3}/gi) !== -1 ||
			// Check that no more than one slash occurs successively
			path.search(/\/{2}/gi) !== -1)
			throw new SyntaxError('Syntax error on whitelist entry ' + path);
	});

	var result = [];

	for (var i = 0; i < whitelist.length; i++) {
		var entry = whitelist[i];
		// Remove trailing slash if present
		if (entry[entry.length - 1] === '/') { entry = entry.substring(0, entry.length - 1); }

		// Escape dots and slashes
		entry = entry.replace('.', '\\.');
		entry = entry.replace(/\//g,'\\/');
		// Make sure matching starts at the beginning of the string
		entry = '^' + entry;
		// Turn directory-spanning glob ** into multi dir regex
		entry = entry.replace(/\*\*/g, MULTI_DIR_GLOB);
		// Turn directory-limited glob * into single dir regex
		entry = entry.replace(/\*/g, SINGLE_DIR_GLOB);
		// Turn # into * again
		entry = entry.replace(/#/g,'*');
		// Make sure the whole string is matched
		entry = entry + '$';
		result.push(new RegExp(entry, 'gi'));
	}
	return result;
}

/**
 * Checks whether the path, when normalized, is covered by any of the provided regexes.
 * Normalization means the path has a a leading slash, but no trailing.
 * @param path{string} - The path to check
 * @param regexes{array} - Array of regexes to check against
 * @returns {Boolean} - True if at least one of the regexes matched the path, false otherwise
 */
function allowed(path, regexes) {
	// Normalize url: Make sure there is a leading slash, but no trailing
	if (path[0] !== '/') { path = '/' + path; }
	if (path[path.length - 1] === '/') { path = path.substring(0, path.length - 1); }
	for (var i = 0; i < regexes.length; i++) {
		if (path.search(regexes[i]) !== -1) {
			return true;
		}
	}

	return false;
}

/**
 * Returns a middleware that will allow all requests to paths covered by the passed whitelist,
 * and channel all other requests through the passport bearer strategy in auth-infrastructure.
 *
 * Whitelisting works as follows
 * - /abc matches only the path /abc
 * - /abc/* matches all resources contained directly at /abc
 * - /abc/** matches all resources contained at /abc or any of its subpaths
 */
function makeMiddleware(whitelist) {
	whitelist = regex(whitelist);

	return function restrict(req,res,next) {
		var path = url.parse(req.url).pathname;
		if (allowed(path, whitelist)) {
			req.access = 'whitelisted';
			return next(null,req,res);
		} else {
			req.access = 'restricted';
			return passport.authenticate('bearer', { session: false })(req,res,next);
		}
	};
}

module.exports = makeMiddleware;

// Expose helper functions for testing
if (process.env.NODE_ENV === 'test') {
	module.exports.allowed = allowed;
	module.exports.regex = regex;
};