var nodemailer = require('nodemailer');
var smtpConfig = require('../config/mail.json');
var Promise = require('bluebird').Promise;

var smtpTransport = require('nodemailer-smtp-transport');
//Do not load the stubmailer unless in test environment. This enables us to keep it as a dev dependency only
var stubTransport = process.env.NODE_ENV === 'test' ? require('nodemailer-stub-transport') : null;
var htmlToText = require('nodemailer-html-to-text').htmlToText;

var transports = {
		production: smtpTransport.call(null,smtpConfig),
		development: smtpTransport.call(null, smtpConfig),
		test: stubTransport ? stubTransport() : null // stubTransport might not be defined (see require above)
}

function Mailer() {

}
Mailer.createMailer = function() {
	var mailer = nodemailer.createTransport.call(nodemailer, transports[process.env.NODE_ENV]);
	mailer.use('compile', htmlToText());

	// Promisify API
	mailer.sendMail = Promise.promisify(mailer.sendMail);

	return mailer;
};

module.exports.Mailer = Mailer;