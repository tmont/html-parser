var htmlParser = require('../src/parser.js');

exports.parser = htmlParser;

exports.parseString = function(string, options, regex) {
	htmlParser.parse(string, options, regex);
};