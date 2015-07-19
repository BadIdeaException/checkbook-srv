var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var whitelist = require('./config/whitelist.json')[process.env.NODE_ENV];
var restrict = require('./auth/restrict');
var routes = require('./routes/index');

var app = express();

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
if (app.get('env') === 'development') app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// In production environment, redirect all insecure http
// requests to secure https
if (app.get('env') === 'production') {
	app.use(function(req,res,next) {
		if (!req.secure) return res.redirect('https://' + req.hostname + req.originalUrl);
		else next(null, req,res);
	});
	console.log('HTTPS redirection enabled for all routes');
}
// Restrict access to non-whitelisted routes
app.use(restrict(whitelist));
app.use(express.static('/www'));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.send({
//        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
//    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
