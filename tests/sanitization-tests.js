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
});
