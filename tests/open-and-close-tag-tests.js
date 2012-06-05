var should = require('should');
var helpers = require('./helpers');

describe('opening and closing tags', function() {
	it('element without a closing tag', function() {
		var count = 0;
		helpers.parseString('<foo>', {
			openElement: function(name, context) {
				name.should.equal('foo');
				helpers.verifyContext(1, 2, context);
				count++;
			}
		});

		count.should.equal(1);
	});

	it('element with a closing tag', function() {
		var openCount = 0, closeCount = 0;
		helpers.parseString('<foo></foo>', {
			openElement: function(name, context) {
				name.should.equal('foo');
				helpers.verifyContext(1, 2, context);
				openCount++;
			},
			closeElement: function(name, context) {
				name.should.equal('foo');
				helpers.verifyContext(1, 8, context);
				closeCount++;
			}
		});

		openCount.should.equal(1);
		closeCount.should.equal(1);
	});

	it('opening and closing tag mismatch', function() {
		var openCount = 0, closeCount = 0;
		helpers.parseString('<foo></bar>', {
			openElement: function(name, context) {
				name.should.equal('foo');
				helpers.verifyContext(1, 2, context);
				openCount++;
			},
			closeElement: function(name, context) {
				name.should.equal('bar');
				helpers.verifyContext(1, 8, context);
				closeCount++;
			}
		});

		openCount.should.equal(1);
		closeCount.should.equal(1);
	});

	it('element with a closing tag that doesn\'t end', function() {
		var openCount = 0, closeCount = 0;
		helpers.parseString('<foo></foo', {
			openElement: function(name, context) {
				name.should.equal('foo');
				helpers.verifyContext(1, 2, context);
				openCount++;
			},
			closeElement: function(name, context) {
				name.should.equal('foo');
				helpers.verifyContext(1, 8, context);
				closeCount++;
			}
		});

		openCount.should.equal(1);
		closeCount.should.equal(1);
	});

	it('outputs buffered text node before open element', function() {
		var openCount = 0, textCount = 0;
		helpers.parseString('foo<bar>', {
			openElement: function(name, context) {
				textCount.should.equal(1);
				name.should.equal('bar');
				helpers.verifyContext(1, 5, context);
				openCount++;
			},
			text: function(name, context) {
				name.should.equal('foo');
				helpers.verifyContext(1, 1, context);
				textCount++;
			}
		});

		openCount.should.equal(1);
		textCount.should.equal(1);
	});

	it('outputs buffered text node before close element', function() {
		var closeCount = 0, textCount = 0;
		helpers.parseString('foo</bar>', {
			closeElement: function(name, context) {
				textCount.should.equal(1);
				name.should.equal('bar');
				helpers.verifyContext(1, 6, context);
				closeCount++;
			},
			text: function(name, context) {
				name.should.equal('foo');
				helpers.verifyContext(1, 1, context);
				textCount++;
			}
		});

		closeCount.should.equal(1);
		textCount.should.equal(1);
	});
});
