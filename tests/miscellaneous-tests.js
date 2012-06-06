var should = require('should');
var helpers = require('./helpers');

describe('Miscellany', function() {
	it('should normalize line endings to lf', function() {
		var textCount = 0;
		helpers.parseString('foo\r\nbar\nbaz\r\r\n', {
			text: function(value) {
				value.should.equal('foo\nbar\nbaz\n\n');
				textCount++;
			}
		});

		textCount.should.equal(1);
	});
});