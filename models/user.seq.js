"use strict";

var Promise = require('bluebird');
var bcrypt = function() {
	var _bcrypt = require('bcryptjs');
	return {
		hash: Promise.promisify(_bcrypt.hash),
		compare: Promise.promisify(_bcrypt.compare)
	};
}();

module.exports = function(sequelize, DataTypes) {
	var User = sequelize.define("User", {
		username: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		password: {
			type: DataTypes.TEXT,
			allowNull: false,
			set: function() { throw new Error('Setting the password directly is not permitted. Use setPassword instead.')}
		},
		email: {
			type: DataTypes.TEXT,
			allowNull: false,
			validate: {
				isEmail: true
			}
		},
		activated: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		confirmationToken: {
			type: DataTypes.TEXT,
			unique: true,
			field: 'confirmation_token'
		}
	}, {
		classMethods: {
			/**
			 * The time span within which newly registered users need to
			 * confirm their registration.
			 */
			CONFIRMATION_DEADLINE: 60*60*1000,
			associate: function(models) {
			}
		},
		instanceMethods: {
			/**
			 * Sets the password for this user to be the bcrypt-hashed
			 * plain text, using the optional salt. If no salt is specified,
			 * one will be created using a standard of 10 rounds. If a number
			 * is passed as the salt, it is interpreted as the number of rounds
			 * to use for salt generation. (See bcrypt docs)
			 *
			 * The user is not saved, so don't forget to call save() to persist
			 * the change.
			 *
			 * @param plain {string} - The new password in plain text
			 * @param [salt] {string|number} - The salt to use, or the number of rounds to use if
			 * a salt should be generated. Defaults to 10.
			 *
			 * @returns A promise that fulfills when the password
			 * has been hashed and set. It fulfills to the user
			 * to allow promise chaining.
			 */
			setPassword: function(plain, salt) {
				// Create a salt using ten rounds as a standard
				salt = salt || 10;
				return bcrypt.hash(plain, salt).bind(this).then(function(hash) { // Promisified bcrypt.hash
					this.setDataValue('password', hash);
					return this; // Return this for promise chaining
				});
			},
			/**
			 * Attempts a login for this user using the supplied password. The login will
			 * succeed if this user is activated and the supplied password matches the
			 * user's password.
			 * @param plain {string} - The plain text password to attempt login with
			 * @returns A promise resolving to true if the login was successful and to false
			 * if it wasn't.
			 * (Note that the promise is not rejected however.)
			 */
			login: function(plain) {
				if (this.activated) return bcrypt.compare(plain, this.password); // Promisified bcrypt.compare
				else return Promise.resolve(false);
			},
			/**
			 * Confirms a newly created user if the supplied token is correct by deleting
			 * the token and setting activated to true.
			 * @param {string} token - The confirmation token
			 * @returns true if the user was confirmed (i.e. the token was correct),
			 * false otherwise.
			 */
			confirm: function(token) {
				if (token === this.confirmationToken) {
					this.confirmationToken = null;
					this.activated = true;
					return true;
				} else
					return false;
			},
		},
		hooks: {
			// Hook that will automatically delete the user from the database again
			// if it does not get confirmed in time
			// Note: the self destruction promise will still fire even if the user
			// has been confirmed in the mean time. However, the guard against
			// user.activated will then prevent it from deleting the user.
			// Therefore, it is not necessary to cancel the timer/promise when
			// confirming
			afterCreate: function setupSelfDestruction(user, options, done) {
				// Create a promise that fulfills when the timer for
				// self destruction has expired
				user.selfDestruct = new Promise(function(resolve, reject) {
					var timeout = setTimeout(resolve, User.CONFIRMATION_DEADLINE);
				}).then(function() {
					// Reload values from db to make sure we're not working
					// on outdated data
					// (There might be several model instances for this
					// database record)
					return user.reload().then(function(user) {
						if (!user.activated) user.destroy();
					});
				});

				done();
			}
		},
		timestamps: false,
		underscored: true,
		tableName: 'users'
	});
	return User;
};