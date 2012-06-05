var htmlParser = require('../src/parser.js');

exports.parser = htmlParser;

exports.parseString = function(string, options) {
	htmlParser.parse(string, options);
};