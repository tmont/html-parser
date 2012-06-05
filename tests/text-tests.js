var helpers = require('./helpers');

describe('text', function() {
	it('outside of everything', function() {
		var textCount = 0;
		helpers.parseString('foo', {
			text: function(text, context) {
				text.should.equal('foo');
				helpers.verifyContext(1, 1, context);
				textCount++;
			}
		});

		textCount.should.equal(1);
	});

	it('inside a tag', function() {
		var textCount = 0;
		helpers.parseString('<foo>bar and such</foo>', {
			text: function(text, context) {
				text.should.equal('bar and such');
				helpers.verifyContext(1, 6, context);
				textCount++;
			}
		});

		textCount.should.equal(1);
	});
});