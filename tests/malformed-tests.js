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

	it('< followed by whitespace is not a tag', function() {
		var openCount = 0, textCount = 0;
		helpers.parseString('< foo>', {
			openElement: function(name) {
				openCount++;
			},

			text: function(value) {
				value.should.equal('< foo>');
				textCount++;
			}
		});

		openCount.should.equal(0);
		textCount.should.equal(1);
	});

	it('< followed by ! but not cdata or comment should be a text node', function() {
		var openCount = 0, textCount = 0, cdataCount = 0, commentCount = 0;
		helpers.parseString('<! foo', {
			openElement: function(name) {
				openCount++;
			},
			cdata: function(name) {
				cdataCount++;
			},
			comment: function(name) {
				commentCount++;
			},

			text: function(value) {
				value.should.equal('<! foo');
				textCount++;
			}
		});

		textCount.should.equal(1);
		openCount.should.equal(0);
		cdataCount.should.equal(0);
		commentCount.should.equal(0);
	});

	it('</ not followed by a letter is text', function() {
		var closeCount = 0, textCount = 0;
		helpers.parseString('</ foo>', {
			closeElement: function(name) {
				closeCount++;
			},

			text: function(value) {
				value.should.equal('</ foo>');
				textCount++;
			}
		});

		textCount.should.equal(1);
		closeCount.should.equal(0);
	});
});