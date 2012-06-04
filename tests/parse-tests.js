require('should');
var htmlParser = require('../src/parser.js');

function parseString(string, options) {
	htmlParser.parse(string, options);
}

function verifyContext(line, column, context) {
	context.should.have.property('line').equal(line);
	context.should.have.property('column').equal(column);
}

describe('Parsing', function() {
	it('element without a closing tag', function() {
		var count = 0;
		parseString('<foo>', {
			openElement: function(name, context) {
				name.should.equal('foo');
				verifyContext(1, 2, context);
				count++;
			}
		});

		count.should.equal(1);
	});

	it('element with a closing tag', function () {
		var openCount = 0, closeCount = 0;
		parseString('<foo></foo>', {
			openElement: function (name, context) {
				name.should.equal('foo');
				verifyContext(1, 2, context);
				openCount++;
			},
			closeElement: function(name, context) {
				name.should.equal('foo');
				verifyContext(1, 6, context);
				closeCount++;
			}
		});

		openCount.should.equal(1);
		closeCount.should.equal(1);
	});
});
