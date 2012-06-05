var should = require('should');
var helpers = require('./helpers');

describe('XML Prologs', function() {
	it('at beginning of document', function() {
		var prologCount = 0, attributeCount = 0;
		helpers.parseString('<?xml version="1.0" ?>', {
			xmlProlog: function() {
				prologCount++;
			},
			attribute: function(name, value) {
				name.should.equal('version');
				value.should.equal('1.0');
				attributeCount++;
			}
		});

		prologCount.should.equal(1);
		attributeCount.should.equal(1);
	});

	it('without attributes', function() {
		var prologCount = 0, attributeCount = 0;
		helpers.parseString('<?xml?>', {
			xmlProlog: function() {
				prologCount++;
			},
			attribute: function(name, value) {
				attributeCount++;
			}
		});

		prologCount.should.equal(1);
		attributeCount.should.equal(0);
	});

	it('are case sensitive', function() {
		var prologCount = 0, textCount = 0;
		helpers.parseString('<?XML ?>', {
			xmlProlog: function() {
				prologCount++;
			},
			text: function(value) {
				value.should.equal('<?XML ?>');
				textCount++;
			}
		});

		prologCount.should.equal(0);
		textCount.should.equal(1);
	});

	it('in middle of document', function() {
		var prologCount = 0, attributeCount = 0, openCount = 0, closeCount = 0;
		helpers.parseString('<foo><?xml version="1.0" ?></foo>', {
			xmlProlog: function() {
				prologCount++;
			},
			openElement: function(name) {
				name.should.equal('foo');
				openCount++;
			},
			closeElement: function(name) {
				name.should.equal('foo');
				closeCount++;
			},
			attribute: function(name, value) {
				openCount.should.equal(1);
				closeCount.should.equal(0);
				name.should.equal('version');
				value.should.equal('1.0');
				attributeCount++;
			}
		});

		prologCount.should.equal(1);
		openCount.should.equal(1);
		closeCount.should.equal(1);
	});
});