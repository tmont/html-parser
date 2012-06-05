require('should');
var helpers = require('./helpers');

describe('Comments', function() {
	it('inside tags', function() {
		var commentCount = 0;
		helpers.parseString('<foo><!-- foo bar --></foo>', {
			comment: function(value, context) {
				value.should.equal(' foo bar ');
				helpers.verifyContext(1, 6, context);
				commentCount++;
			}
		});
	});

	it('spanning multiple lines', function() {
		var commentCount = 0;
		helpers.parseString('<!-- foo \nbar -->', {
			comment: function(value, context) {
				value.should.equal(' foo \nbar ');
				helpers.verifyContext(1, 1, context);
				commentCount++;
			}
		});
	});

	it('allow tags and entities', function() {
		var commentCount = 0;
		helpers.parseString('<!-- foo & <bar> -->', {
			comment: function(value, context) {
				value.should.equal(' foo & <bar> ');
				helpers.verifyContext(1, 1, context);
				commentCount++;
			}
		});
	});

	it('read to EOF if --> is not given', function() {
		var commentCount = 0;
		helpers.parseString('<!-- foo', {
			comment: function(value, context) {
				value.should.equal(' foo');
				helpers.verifyContext(1, 1, context);
				commentCount++;
			}
		});
	});
});