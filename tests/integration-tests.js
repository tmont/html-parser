var should = require('should');
var helpers = require('./helpers');

describe('Integration', function() {
	it('real life HTML document', function(done) {
		var content = '';
		var inScriptTag = false;
		helpers.parser.parseFile(__dirname + '/files/good.html', 'utf8', {
			docType: function(value) {
				content += '<!doctype ' + value + '>\n';
			},

			openElement: function(name) {
				content += '<' + name;
				if (name === 'script') {
					inScriptTag = true;
				}
			},

			closeOpenedElement: function(token) {
				content += token;
			},

			closeElement: function(name) {
				content += '</' + name + '>';
				if (name === 'script') {
					inScriptTag = false;
				}
			},

			attribute: function(name, value) {
				content += ' ' + name + '="' + value.replace(/"/g, '&quot;') + '"';
			},

			text: function(value) {
				content += value;
			},

			comment: function(value) {
				content += '<!--' + value + '-->';
			},

			cdata: function(value) {
				if (inScriptTag) {
					content += value;
				} else {
					content += '<![CDATA[' + value + ']]>';
				}
			}
		}, function(err) {
			should.not.exist(err);
			var expected = require('fs').readFileSync(__dirname + '/files/good-expected.html', 'utf8');
			content.should.equal(expected);
			done();
		});
	});
});