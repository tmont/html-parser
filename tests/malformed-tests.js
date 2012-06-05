var should = require('should');
var helpers = require('./helpers');

describe('Malformed HTML', function() {
	it('unescaped < in text should not be an open tag', function() {
		var openCount = 0, textCount = 0;
		helpers.parseString('5 < 4 == false', {
			openElement: function(name) {
				openCount++;
			},

			text: function(value, context) {
				value.should.equal('5 < 4 == false');
				textCount++;
			}
		});

		openCount.should.equal(0);
		textCount.should.equal(1);
	});

	it('< followed by a letter without a following > is still a tag', function() {
		var openCount = 0, textCount = 0;
		helpers.parseString('< foo', {
			openElement: function(name) {
				name.should.equal('foo');
				openCount++;
			},

			text: function(value) {
				textCount++;
			}
		});

		openCount.should.equal(1);
		textCount.should.equal(0);
	});
});