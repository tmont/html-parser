var htmlParser = require('../src/parser.js');

exports.parser = htmlParser;

exports.parseString = function(string, options) {
	htmlParser.parse(string, options);
};

exports.verifyContext = function(line, column, context) {
	context.should.have.property('line').equal(line);
	context.should.have.property('column').equal(column);
};