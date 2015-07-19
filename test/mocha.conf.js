if (process && process.env.NODE_ENV !== 'test') { process.env.NODE_ENV = 'test'; }

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var chaiHttp = require('chai-http');
var sinonChai = require('sinon-chai');
var sequelize = require('../models').sequelize;

chai.use(sinonChai);
chai.use(chaiHttp);
chai.use(chaiAsPromised);

if (!global.Promise) { chai.request.addPromises(require('bluebird').Promise); }

global.expect = chai.expect;
global.sinon = require('sinon');
global.chai = chai;


//sequelize.sync({ force: true, logging: null }).then(function() {
//	 Add logic to add triggers, functions etc. to database
//});