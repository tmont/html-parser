var should = require('should');
var helpers = require('./helpers');
var fs = require('fs');

describe('Integration', function() {
	it('real life HTML document', function() {
		var string = fs.readFileSync(__dirname + '/files/good.html', 'utf8');
		var expected = fs.readFileSync(__dirname + '/files/good-expected.html', 'utf8');
		var sanitized = helpers.parser.sanitize(string);
		sanitized.should.equal(expected);
	});
});