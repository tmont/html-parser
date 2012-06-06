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

	it('should remove comments', function() {
		var sanitized = helpers.parser.sanitize('<!-- foo --><foo><!-- foo --></foo><!-- foo -->', {
			comments: true
		});
		sanitized.should.equal('<foo></foo>');
	});

	it('should remove specified attributes', function() {
		var sanitized = helpers.parser.sanitize('<foo bar="baz" bat="qux"></foo>', {
			attributes: [ 'bar' ]
		});
		sanitized.should.equal('<foo bat="qux"></foo>');
	});

	it('should remove specified elements', function() {
		var sanitized = helpers.parser.sanitize('<foo><bar><baz><bat></bat></baz></bar><bat></bat></foo>', {
			elements: [ 'bat' ]
		});
		sanitized.should.equal('<foo><bar><baz></baz></bar></foo>');
	});
});
