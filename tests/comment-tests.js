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

		commentCount.should.equal(1);
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

		commentCount.should.equal(1);
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

		commentCount.should.equal(1);
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

		commentCount.should.equal(1);
	});

	it('outputs buffered text node before comment', function() {
		var commentCount = 0, textCount = 0;
		helpers.parseString('foo<!-- bar -->', {
			text: function(value, context) {
				value.should.equal('foo');
				helpers.verifyContext(1, 1, context);
				textCount++;
			},
			comment: function(value, context) {
				textCount.should.equal(1);
				value.should.equal(' bar ');
				helpers.verifyContext(1, 4, context);
				commentCount++;
			}
		});

		commentCount.should.equal(1);
		textCount.should.equal(1);
	});
});