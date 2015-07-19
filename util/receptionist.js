var models = require('../models');
var User = models.User;
var Promise = require('bluebird').Promise;
var Mailer = require('./mailer').Mailer;
var ConfirmationToken = require('../auth/tokens').ConfirmationToken;
var jade = require('jade');
var path = require('path');

var makeRegistrationMailBody = jade.compileFile(path.join(__dirname, '../res/mail/register.jade'));
var makeReadmittanceMailBody = jade.compileFile(path.join(__dirname, '../res/mail/readmit.jade'));

/**
 * Helper object for dealing with user management. It takes care of registering users, readmitting
 * them if they lost their password, and confirming registration and readmittance of users. This
 * involves both the required database operations as well as sending transactional email.
 */
module.exports = new function Receptionist() {
	var self = this;
	self.mailer = Mailer.createMailer();

	/**
	 * Registers a new user. This involves
	 *
	 * - creating a confirmation token for the new user,
	 * - saving the user to the database,
	 * - and sending a confirmation email containing an activation link to the user.
	 *
	 * @param user {User} - The new user to be registered.
	 * @returns A promise resolving to an object containing the user as user and
	 * the response of sending the mail as response.
	 */
	this.register = function(user) {
		if (!(user instanceof User.Instance)) throw new TypeError('Parameter user must be a User instance');

		var token = new ConfirmationToken();
		user.confirmationToken = token.token;
		var link = 'https://checkbook.dlinkddns.com/#/register/confirm/' + token.token;

		// Create a promise that will be fulfilled when both the promise from user.save
		// and the promise from mailer.sendMail are fulfilled
		return user
			.save()
			.then(function(user) {
				return self.mailer.sendMail({
					from: "Checkbook <checkbook@gmx.de>",
					to: user.email,
					subject: 'Please confirm your registration on Checkbook',
					html: makeRegistrationMailBody({
						username : user.username,
						link : link
					})
				});
			// Turn the results from array form into an object
			}).then(function(response) {
				return { user: user, response: response };
			});
	};

	/**
	 * Readmits a user with a forgotten password. This involves
	 *
	 * - setting a confirmation token on the user
	 * - saving the user
	 * - sending a readmittance email containing a reactivation link to the user
	 * @param user {User} - The user to readmit
	 * @returns A promise resolving to an object containing the user under user and
	 * the response of the mail sending under response
	 */
	this.readmit = function(user) {
		if (!(user instanceof User.Instance)) throw new TypeError('Parameter user must be a User instance');

		var token = new ConfirmationToken();
		var link = "https://checkbook.dlinkddns.com/#/login/forgot-password/confirm/" + token.token;
		user.confirmationToken = token.token;

		return Promise
			.join(user.save(),
				self.mailer.sendMail({
					from: 'Checkbook <checkbook@gmx.de>',
					to: user.email,
					subject: 'Your password on Checkbook',
					html: makeReadmittanceMailBody({
						username: user.username,
						link: link
					})
				}))
			.then(function(results) {
				return { user: results[0], response: results[1] };
			});
	};

	/**
	 * Tries to confirm registration or readmittance of the provided user using the supplied token.
	 * If successful, the user afterward has activated set to true and confirmationToken set to null,
	 * and is saved.
	 * @param user {User} - The user to confirm registration/readmittance for
	 * @param token - The confirmation token
	 * @returns A promise resolving to the result of the confirmation.
	 */
	this.confirm = function(user,token) {
		if (!(user instanceof User.Instance)) throw new TypeError('Parameter user must be a User instance');
		if (!(typeof token === 'string')) throw new TypeError('Parameter token must be a string');

		if (user.confirm(token)) {
			return user.save().then(function() { return Promise.resolve(true) });
		} else return Promise.resolve(false);
	};
}();