var Mailer = require('../../util/mailer').Mailer;
var Promise = require('bluebird').Promise;

describe('Mailer', function() {
	var mailer;
	var mail = {
		from: 'from@from.from',
		to: 'to@to.to',
		subject: 'subject',
		text: 'text'
	};

	function createMailer() {
		mailer = Mailer.createMailer();
	};

	beforeEach(createMailer)

	it('createMailer should create an object with method sendMail', function() {
		expect(mailer).itself.to.respondTo('sendMail');
	});

	describe('#sendMail', function() {
		beforeEach(createMailer);

		it('should return a promise', function() {
			expect(mailer.sendMail(mail)).to.be.an.instanceOf(Promise);
		});

		it('should send the mail correctly', function() {
			return expect(mailer.sendMail(mail)).to.eventually.satisfy(function(info) {
				var response = info.response.toString(); // info.response is a buffer
				return (response.indexOf('From: ' + mail.from) !== -1) &&
					(response.indexOf('To: ' + mail.to) !== -1) &&
					(response.indexOf('Subject: ' + mail.subject) !== -1) &&
					(response.substr(response.length - mail.text.length) === mail.text) // Should end with mail.text
			});
		});
	})
})