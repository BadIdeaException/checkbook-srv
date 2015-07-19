var models = require('../../models');
var Month = models.Month;

describe('Month', function() {
	it('should calculate month id', function() {
		// Check that it works when supplying month and year
		var id = Month.getId(0,1970)
		expect(id, 'from month and year').to.equal(0);

		// Check that it works when supplying a date string
		id = Month.getId('1970-10-10');
		expect(id, 'from date string').to.equal(9);

		// Check that it works when supplying a date object
		id = Month.getId(new Date(1975,0));
		expect(id, 'from date object').to.equal(60);
	});

	it('should calculate correct month for instance', function() {
		var month = Month.build({
			id: 9,
			value: 0
		});
		expect(month.getMonth()).to.equal(9);
	});
	it('should calculate correct year for instance', function() {
		var month = Month.build({
			id: 60,
			value: 0
		});
		expect(month.getYear()).to.equal(1975);
	});
});
