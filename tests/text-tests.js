var helpers = require('./helpers');

describe('text', function() {
	it('outside of everything', function() {
		var textCount = 0;
		helpers.parseString('foo', {
			text: function(text) {
				text.should.equal('foo');
				textCount++;
			}
		});

		textCount.should.equal(1);
	});

	it('inside a tag', function() {
		var textCount = 0;
		helpers.parseString('<foo>bar and such</foo>', {
			text: function(text) {
				text.should.equal('bar and such');
				textCount++;
			}
		});

		textCount.should.equal(1);
	});
});