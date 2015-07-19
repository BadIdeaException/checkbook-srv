/*
 * THESE ROUTES ARE ALL LEGACY. REPLACE THEM WITH A MORE RESTFUL API
 * ON THE NEXT OVERHAUL OF THE WEB CLIENT
 */
var express = require('express');
var router = express.Router();
var models = require('../models');
var User = models.User;
var url = require('url');
var auth = require('../auth/auth-infrastructure');
var receptionist = require('../util/receptionist');

router.mountpoint = '/';


router.post('/oauth/token', [ auth.server.token(), auth.server.errorHandler() ]);

// Uncomment to reactivate registration
//app.post('/register', routes.postRegister);
if (process.env.NODE_ENV === 'production')
	router.post('/register', function(req,res) { res.status(503).end(); /* 503 Service temporarily unavailable */ });
else router.post('/register', function(req,res) {
	var user = User.build(req.body);
	return user.validate().then(function(errors) {
		if (errors) return res.status(400).json(errors);
		return receptionist
			.register(user)
			.then(function(user, mailresponse) {
				return res.status(201).end();
			})
			.catch(models.Sequelize.SequelizeUniqueConstraintError, function(err) {
				// A user with this name already exists
				return res.status(409).end(); // 409 Conflict
			});
	});
});

router.post('/register/confirm/:token', function(req,res) {
	return User
		.find({ where: { token: req.params.token }})
		.then(function(user) {
			if (!user) return res.status(410).end(); // 410 Gone
			return receptionist
				.confirm(user, req.params.token)
				.then(function(success) {
					if (success) return res.status(200).end()
					else return res.status(410).end(); // 410 Gone
				});
		});
});

router.post('/login/forgot-password', function(req,res) {
	if (!req.body.username) return res.status(400).send('Username missing');
	return User
		.findById(req.body.username)
		.then(function(user) {
			if (!user) return res.status(404).end();
			return receptionist
				.readmit(user)
				.then(function(user, response) {
					return res.status(204).end();
				});
		});
});

router.get('/login/forgot-password/confirm/:token', function(req,res) {
	return res.sendFile('../public/forgot-password-reset.html');
});

router.post('/login/forgot-password/confirm/:token', function(req,res) {
	if (!req.body.password) return res.status(400).send('No password set');

	return User
		.find({ where: { token: req.params.token }})
		.then(function(user) {
			if (!user) return res.status(410).end(); // 410 Gone
			return receptionist
				.confirm(user, req.params.token)
				.then(function(user, response) {
					return res.status(200).end();
				})
		})
});

module.exports = router;

//app.post('/login/forgot-password', routes.postForgotPassword);
//app.get('/login/forgot-password/confirm/:token', routes.getForgotPasswordConfirm);
//app.post('/login/forgot-password/confirm/:token', routes.postForgotPasswordConfirm);

