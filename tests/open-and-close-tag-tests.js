var should = require('should');
var helpers = require('./helpers');

describe('opening and closing tags', function() {
	it('element without a closing tag', function() {
		var count = 0;
		helpers.parseString('<foo>', {
			openElement: function(name) {
				name.should.equal('foo');
				count++;
			}
		});

		count.should.equal(1);
	});

	it('element with a closing tag', function() {
		var openCount = 0, closeCount = 0;
		helpers.parseString('<foo></foo>', {
			openElement: function(name) {
				name.should.equal('foo');
				openCount++;
			},
			closeElement: function(name) {
				name.should.equal('foo');
				closeCount++;
			}
		});

		openCount.should.equal(1);
		closeCount.should.equal(1);
	});

	it('tag names can start with _', function() {
		var openCount = 0, closeCount = 0;
		helpers.parseString('<_foo></_foo>', {
			openElement: function(name) {
				name.should.equal('_foo');
				openCount++;
			},
			closeElement: function(name) {
				name.should.equal('_foo');
				closeCount++;
			}
		});

		openCount.should.equal(1);
		closeCount.should.equal(1);
	});

	it('opening and closing tag mismatch', function() {
		var openCount = 0, closeCount = 0;
		helpers.parseString('<foo></bar>', {
			openElement: function(name) {
				name.should.equal('foo');
				openCount++;
			},
			closeElement: function(name) {
				name.should.equal('bar');
				closeCount++;
			}
		});

		openCount.should.equal(1);
		closeCount.should.equal(1);
	});

	it('tag names with weird whitespace', function() {
		var openCount = 0, closeCount = 0;
		helpers.parseString('< \n  foo\n></  \n  bar    >', {
			openElement: function(name) {
				name.should.equal('foo');
				openCount++;
			},
			closeElement: function(name) {
				name.should.equal('bar');
				closeCount++;
			}
		});

		openCount.should.equal(1);
		closeCount.should.equal(1);
	});

	it('element with a closing tag that doesn\'t end', function() {
		var openCount = 0, closeCount = 0;
		helpers.parseString('<foo></foo', {
			openElement: function(name) {
				name.should.equal('foo');
				openCount++;
			},
			closeElement: function(name) {
				name.should.equal('foo');
				closeCount++;
			}
		});

		openCount.should.equal(1);
		closeCount.should.equal(1);
	});

	it('outputs buffered text node before open element', function() {
		var openCount = 0, textCount = 0;
		helpers.parseString('foo<bar>', {
			openElement: function(name) {
				textCount.should.equal(1);
				name.should.equal('bar');
				openCount++;
			},
			text: function(name) {
				name.should.equal('foo');
				textCount++;
			}
		});

		openCount.should.equal(1);
		textCount.should.equal(1);
	});

	it('outputs buffered text node before close element', function() {
		var closeCount = 0, textCount = 0;
		helpers.parseString('foo</bar>', {
			closeElement: function(name) {
				textCount.should.equal(1);
				name.should.equal('bar');
				closeCount++;
			},
			text: function(name) {
				name.should.equal('foo');
				textCount++;
			}
		});

		closeCount.should.equal(1);
		textCount.should.equal(1);
	});

	it('self closing tag should emit closeElement', function() {
		var closeCount = 0, openCount = 0;
		helpers.parseString('<foo />', {
			openElement: function(name) {
				name.should.equal('foo');
				openCount++;
			},
			closeElement: function(name) {
				name.should.equal('');
				closeCount++;
			}
		});

		closeCount.should.equal(1);
		openCount.should.equal(1);
	});
});
