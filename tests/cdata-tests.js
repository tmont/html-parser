require('should');
var helpers = require('./helpers');

describe('CDATA', function() {
	it('inside tags', function() {
		var cdataCount = 0;
		helpers.parseString('<foo><![CDATA[ this is cdata ]]></foo>', {
			cdata: function(value, context) {
				value.should.equal(' this is cdata ');
				helpers.verifyContext(1, 6, context);
				cdataCount++;
			}
		});

		cdataCount.should.equal(1);
	});

	it('does not parse elements or entities', function() {
		var cdataCount = 0;
		helpers.parseString('<![CDATA[ <foo> &amp; ]]>', {
			cdata: function(value, context) {
				value.should.equal(' <foo> &amp; ');
				helpers.verifyContext(1, 1, context);
				cdataCount++;
			}
		});

		cdataCount.should.equal(1);
	});

	it('does not parse as text', function() {
		var cdataCount = 0, textCount = 0;
		helpers.parseString('<![CDATA[ foo ]]>', {
			cdata: function(value, context) {
				value.should.equal(' foo ');
				helpers.verifyContext(1, 1, context);
				cdataCount++;
			},

			text: function() {
				textCount++;
			}
		});

		cdataCount.should.equal(1);
		textCount.should.equal(0);
	});

	it('respects line breaks', function() {
		var cdataCount = 0;
		helpers.parseString('<![CDATA[ \nlol ]]>', {
			cdata: function(value, context) {
				value.should.equal(' \nlol ');
				helpers.verifyContext(1, 1, context);
				cdataCount++;
			}
		});

		cdataCount.should.equal(1);
	});

	it('reads to end if no ]]> is found', function() {
		var cdataCount = 0;
		helpers.parseString('<![CDATA[ foobar', {
			cdata: function(value, context) {
				value.should.equal(' foobar');
				helpers.verifyContext(1, 1, context);
				cdataCount++;
			}
		});

		cdataCount.should.equal(1);
	});

	it('outputs buffered text node before cdata', function() {
		var cdataCount = 0, textCount = 0;
		helpers.parseString('foo<![CDATA[bar]]>', {
			cdata: function(value, context) {
				textCount.should.equal(1);
				value.should.equal('bar');
				helpers.verifyContext(1, 4, context);
				cdataCount++;
			},

			text: function(value, context) {
				value.should.equal('foo');
				helpers.verifyContext(1, 1, context);
				textCount++;
			}
		});

		cdataCount.should.equal(1);
		textCount.should.equal(1);
	});
});