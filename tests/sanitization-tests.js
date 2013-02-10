var should = require('should');
var helpers = require('./helpers');

describe('Sanitization', function() {
	it('should convert tags to lowercase', function() {
		var sanitized = helpers.parser.sanitize('<FOO></FOO>');
		sanitized.should.equal('<foo></foo>');
	});

	it('should convert attribute names to lowercase', function() {
		var sanitized = helpers.parser.sanitize('<foo BAR="BAZ">');
		sanitized.should.equal('<foo bar="BAZ">');
	});

	it('should remove doctypes', function() {
		var sanitized = helpers.parser.sanitize('<!doctype html><foo><!doctype asdf></foo>', {
			docTypes: true
		});
		sanitized.should.equal('<foo></foo>');
	});

	it('should remove doctypes with callback', function() {
		var sanitized = helpers.parser.sanitize('<!doctype html><foo><!doctype asdf></foo>', {
			docTypes: function(value) {
				return value !== 'html';
			}
		});
		sanitized.should.equal('<!doctype html><foo></foo>');
	});

	it('should remove comments', function() {
		var sanitized = helpers.parser.sanitize('<!-- foo --><foo><!-- foo --></foo><!-- foo -->', {
			comments: true
		});
		sanitized.should.equal('<foo></foo>');
	});

	it('should remove comments with callback', function() {
		var sanitized = helpers.parser.sanitize('<!-- foo --><foo><!-- bar --></foo><!-- foo -->', {
			comments: function(value) {
				return /foo/.test(value);
			}
		});
		sanitized.should.equal('<foo><!-- bar --></foo>');
	});

	it('should remove specified attributes', function() {
		var sanitized = helpers.parser.sanitize('<foo bar="baz" bat="qux"></foo>', {
			attributes: [ 'bar' ]
		});
		sanitized.should.equal('<foo bat="qux"></foo>');
	});

	it('should remove attributes with callback', function() {
		var sanitized = helpers.parser.sanitize('<foo bar="baz" bat="qux"></foo>', {
			attributes: function(name, value) {
				return name === 'bar';
			}
		});
		sanitized.should.equal('<foo bat="qux"></foo>');
	});

	it('should remove specified elements', function() {
		var html = '<foo><bar><baz><bat foo=bar>asdf</bat></baz></bar><bat><!-- comment --></bat></foo>';
		var sanitized = helpers.parser.sanitize(html, {
			elements: [ 'bat' ]
		});
		sanitized.should.equal('<foo><bar><baz></baz></bar></foo>');
	});

	it('should remove elements with callback', function() {
		var html = '<foo><bar><baz><bat foo=bar>asdf</bat></baz></bar><bat><!-- comment --></bat></foo>';
		var sanitized = helpers.parser.sanitize(html, {
			elements: function(name) {
				return name === 'bat';
			}
		});
		sanitized.should.equal('<foo><bar><baz></baz></bar></foo>');
	});

	it('should remove self-closing elements', function() {
		var html = '<foo><br />asdf</foo>';
		var sanitized = helpers.parser.sanitize(html, {
			elements: [ 'br' ]
		});
		sanitized.should.equal('<foo>asdf</foo>');
	});

	it('should remove element with attributes', function() {
		var html = '<foo><bar baz="bat"></bar></foo>';
		var sanitized = helpers.parser.sanitize(html, {
			elements: [ 'bar' ]
		});
		sanitized.should.equal('<foo></foo>');
	});

	it('should remove script tag with whitespace', function() {
		var html = '<p>foo<script ></script ></p>';
		var sanitized = helpers.parser.sanitize(html, {
			elements: [ 'script' ]
		});
		sanitized.should.equal('<p>foo</p>');
	});

	it('should remove script tag with attributes', function() {
		var html = '<p>foo<script type="text/javascript">alert("foo");</script></p>';
		var sanitized = helpers.parser.sanitize(html, {
			elements: [ 'script' ]
		});
		sanitized.should.equal('<p>foo</p>');
	});

	it('should handle attributes with no value', function() {
		var html = '<p novalue1 novalue2>foo</p>';
		var sanitized = helpers.parser.sanitize(html, {
			attributes: [ 'novalue1' ]
		});
		sanitized.should.equal('<p novalue2>foo</p>');
	});

	describe('self-closing tag', function() {
		var selfClosingTags = {
			meta: 1,
			br: 1,
			link: 1,
			area: 1,
			base: 1,
			col: 1,
			command: 1,
			embed: 1,
			hr: 1,
			img: 1,
			input: 1,
			param: 1,
			source: 1
		};

		for (var tag in selfClosingTags) {
			it('"' + tag + '" without a closing "/>"', (function(tag) {
				return function() {
					var html = '<' + tag + '><p>foo</p>';
					var sanitized = helpers.parser.sanitize(html, {
						elements: [ tag ]
					});

					sanitized.should.equal('<p>foo</p>');
				}
			}(tag)));
		}
	});

	it('should remove tags within tags', function() {
		var html = '<foo><bar>lolz</bar><bat></bat></foo><baz>oh hai there</baz>';
		var sanitized = helpers.parser.sanitize(html, {
			elements: [ 'foo', 'bar' ]
		});
		sanitized.should.equal('<baz>oh hai there</baz>');
	});

	it('should sanitize based on attribute value', function() {
		var html = '<foo id="abc"></foo><foo id="def"></foo>';
		var sanitized = helpers.parser.sanitize(html, {
			attributes: function(name, value) {
				return value === 'abc';
			}
		});
		sanitized.should.equal('<foo></foo><foo id="def"></foo>');
	});
});
