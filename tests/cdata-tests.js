require('should');
var helpers = require('./helpers');

describe('CDATA', function() {
	it('inside tags', function() {
		var cdataCount = 0;
		helpers.parseString('<foo><![CDATA[ this is cdata ]]></foo>', {
			cdata: function(value) {
				value.should.equal(' this is cdata ');
				cdataCount++;
			}
		});

		cdataCount.should.equal(1);
	});

	it('does not parse elements or entities', function() {
		var cdataCount = 0;
		helpers.parseString('<![CDATA[ <foo> &amp; ]]>', {
			cdata: function(value) {
				value.should.equal(' <foo> &amp; ');
				cdataCount++;
			}
		});

		cdataCount.should.equal(1);
	});

	it('does not parse as text', function() {
		var cdataCount = 0, textCount = 0;
		helpers.parseString('<![CDATA[ foo ]]>', {
			cdata: function(value) {
				value.should.equal(' foo ');
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
			cdata: function(value) {
				value.should.equal(' \nlol ');
				cdataCount++;
			}
		});

		cdataCount.should.equal(1);
	});

	it('reads to end if no ]]> is found', function() {
		var cdataCount = 0;
		helpers.parseString('<![CDATA[ foobar', {
			cdata: function(value) {
				value.should.equal(' foobar');
				cdataCount++;
			}
		});

		cdataCount.should.equal(1);
	});

	it('outputs buffered text node before cdata', function() {
		var cdataCount = 0, textCount = 0;
		helpers.parseString('foo<![CDATA[bar]]>', {
			cdata: function(value) {
				textCount.should.equal(1);
				value.should.equal('bar');
				cdataCount++;
			},

			text: function(value) {
				value.should.equal('foo');
				textCount++;
			}
		});

		cdataCount.should.equal(1);
		textCount.should.equal(1);
	});

	it('script tags do not require CDATA', function() {
		var closeCount = 0, cdataCount = 0, openCount = 0;
		helpers.parseString('<script><foo></script>', {
			openElement: function(name) {
				name.should.equal('script');
				openCount++;
			},

			closeElement: function(name) {
				name.should.equal('script');
				closeCount++;
			},

			cdata: function(value) {
				value.should.equal('<foo>');
				cdataCount++;
			}
		});

		cdataCount.should.equal(1);
		closeCount.should.equal(1);
		openCount.should.equal(1);
	});

	it('xmp tags do not require CDATA', function() {
		var closeCount = 0, cdataCount = 0, openCount = 0;
		helpers.parseString('<xmp><foo></xmp>', {
			openElement: function(name) {
				name.should.equal('xmp');
				openCount++;
			},

			closeElement: function(name) {
				name.should.equal('xmp');
				closeCount++;
			},

			cdata: function(value) {
				value.should.equal('<foo>');
				cdataCount++;
			}
		});

		cdataCount.should.equal(1);
		closeCount.should.equal(1);
		openCount.should.equal(1);
	});

});