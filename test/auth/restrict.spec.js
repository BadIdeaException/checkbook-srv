var auth = require('../../auth/auth-infrastructure');
var restrict = require('../../auth/restrict');
var regex = restrict.regex;
var allowed = restrict.allowed;

describe('regex', function() {
	var whitelist = [ '/path', '/path/*', '/path/**' ];
	var regexes;

	before(function() {
		regexes = regex(whitelist);
	});

	it('should throw TypeError if whitelist is not an array', function() {
		expect(regex.bind(null, '/path')).to.throw(TypeError, /not.*array/i);
	});

	it('should throw SyntaxError on illegal paths /p++th and //path', function() {
		expect(regex.bind(null, [ '/p++th' ])).to.throw(SyntaxError, /syntax error/i);
		expect(regex.bind(null, [ '//path' ])).to.throw(SyntaxError, /syntax error/i);
	});

	it('should prepend ^ and append $', function() {
		expect(regexes[0].source).to.equal('^\\/path$');
	});

	// Note that this test will fail if the order if the allowed characters
	// in restrict.js is changed
	it('should turn * into [A-Za-z0-9%\\-\\._]*', function() {
		expect(regexes[1].source).to.equal('^\\/path\\/[A-Za-z0-9%\\-\\._]*$');
	});

	it('should turn ** into (?!\\/)(?:[A-Za-z0-9%\\-\\._]+\\/)*[A-Za-z0-9%\\-\\._]*', function() {
		expect(regexes[2].source).to.equal('^\\/path\\/(?!\\/)(?:[A-Za-z0-9%\\-\\._]+\\/)*[A-Za-z0-9%\\-\\._]*$');
	});
});

describe('allowed', function() {
	var whitelist;
	function allow(path) { return allowed(path, whitelist); }

	before(function() {
		whitelist = regex([ '/path/**/*.ext' ]);
	});

	it('should allow /path/subpath/basename.ext', function() {
		expect(allow('/path/subpath/basename.ext')).to.be.true;
	});

	it('should allow /path/subpath1/subpath2/basename.ext', function() {
		expect(allow('/path/subpath1/subpath2/basename.ext')).to.be.true;
	});

	it('should deny /basename.ext', function() {
		expect(allow('/basename.ext')). to.be.false;
	});

	it('should deny /path/basename.ext', function() {
		// Because of the globbing syntax, at least one subpath element
		// is expected
		expect(allow('/path/basename.ext')).to.be.false;
	});

	it('should deny /otherpath/subpath/basename.ext', function() {
		expect(allow('/otherpath/subpath/basename.ext')).to.be.false;
	});

	it('should deny /path/subpath/basename.other', function() {
		expect(allow('/path/subpath/basename.other')).to.be.false;
	});
});

// The restriction process needs to be tested directly here, so that it can be
// turned off for the server to facilitate route testing without having to deal
// with authentication
describe('makeMiddleware', function() {
	var whitelist = [ '/' ];
	var middleware;
	var _allowed;
	var _authenticate;
	var server;

	before(function makeMiddleware() {
		middleware = restrict(whitelist);
	});

	before(function stubFunctions() {
		_allowed = sinon.stub(restrict, 'allowed');
		_authenticate = sinon.stub(auth.passport, 'authenticate').returns(function() {});
	});

	after(function() {
		_allowed.restore();
		_authenticate.restore();
	});

	it('should be a function of length 3', function() {
		expect(middleware).to.be.a('function');
		expect(middleware).to.have.length(3);
	});

	it('should call next if whitelisted', function() {
		_allowed.returns(true);
		var req = { url: 'http://host/' };
		var next = sinon.spy();

		middleware(req, {}, next);

		expect(next).to.have.been.called;
		expect(_authenticate).to.not.have.been.called;
		expect(req).to.have.property('access','whitelisted');
	});

	it('should authenticate with passport if not whitelisted', function() {
		_allowed.returns(false);
		var req = { url: 'http://host/path/' };
		var next = sinon.spy();

		middleware(req, {}, next);

		expect(next).to.not.have.been.called;
		expect(_authenticate).to.have.been.called;
		expect(req).to.have.property('access','restricted');
	});
});