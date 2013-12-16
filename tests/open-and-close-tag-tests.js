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

	describe('unary html5 elements', function() {
		var elements = [
			'area', 'base', 'basefont', 'br', 'col', 'frame',
			'hr', 'img', 'input', 'isindex', 'link', 'meta',
			'param', 'embed'
		];

		elements.forEach(function(element) {
			it(element + ' should be unary', function() {
				var closeOpenedCount = 0;
				helpers.parseString('<' + element + '>', {
					closeOpenedElement: function(name, token, unary) {
						name.should.equal(element);
						token.should.equal('>');
						unary.should.be.true;
						closeOpenedCount++;
					}
				});

				closeOpenedCount.should.equal(1);
			});
		});
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
		helpers.parseString('<foo\n></bar  \n  >', {
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

	it('self closing tag should emit closeOpenedElement', function() {
		var closeCount = 0, openCount = 0;
		helpers.parseString('<foo />', {
			openElement: function(name) {
				name.should.equal('foo');
				openCount++;
			},
			closeOpenedElement: function(name, token) {
				name.should.equal('foo');
				token.should.equal('/>');
				closeCount++;
			}
		});

		closeCount.should.equal(1);
		openCount.should.equal(1);
	});

	it('closing script tags allow whitespace', function() {
		var closeCount = 0, openCount = 0;
		helpers.parseString('<script></script \n >', {
			openElement: function(name) {
				name.should.equal('script');
				openCount++;
			},
			closeElement: function(name) {
				name.should.equal('script');
				closeCount++;
			}
		});

		closeCount.should.equal(1);
		openCount.should.equal(1);
	});

	it('closing xmp tags allow whitespace', function() {
		var closeCount = 0, openCount = 0;
		helpers.parseString('<xmp></xmp \n >', {
			openElement: function(name) {
				name.should.equal('xmp');
				openCount++;
			},
			closeElement: function(name) {
				name.should.equal('xmp');
				closeCount++;
			}
		});

		closeCount.should.equal(1);
		openCount.should.equal(1);
	});

	it('closing script tag is not case sensitive', function() {
		var closeCount = 0, openCount = 0;
		helpers.parseString('<script></SCRIPT>', {
			openElement: function(name) {
				name.should.equal('script');
				openCount++;
			},
			closeElement: function(name) {
				name.should.equal('SCRIPT');
				closeCount++;
			}
		});

		closeCount.should.equal(1);
		openCount.should.equal(1);
	});

	it('should not parse cdata or close element if script tag is unclosed', function() {
		var closeCount = 0, openCount = 0, cdataCount = 0;
		helpers.parseString('<script>', {
			openElement: function(name) {
				name.should.equal('script');
				openCount++;
			},
			cdata: function(value) {
				cdataCount++;
			},
			closeElement: function(name) {
				closeCount++;
			}
		});

		closeCount.should.equal(0);
		cdataCount.should.equal(0);
		openCount.should.equal(1);
	});

	it('should not parse cdata if script tag is empty', function() {
		var closeCount = 0, openCount = 0, cdataCount = 0;
		helpers.parseString('<script></script>', {
			openElement: function(name) {
				name.should.equal('script');
				openCount++;
			},
			cdata: function(value) {
				cdataCount++;
			},
			closeElement: function(name) {
				name.should.equal('script');
				closeCount++;
			}
		});

		closeCount.should.equal(1);
		cdataCount.should.equal(0);
		openCount.should.equal(1);
	});
});
