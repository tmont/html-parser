var should = require('should');
var helpers = require('./helpers');

describe('DocTypes', function() {
	it('at beginning of document', function() {
		var docTypeCount = 0;
		helpers.parseString('<!doctype html>', {
			docType: function(value) {
				value.should.equal('html');
				docTypeCount++;
			}
		});

		docTypeCount.should.equal(1);
	});

	it('in middle of document', function() {
		var docTypeCount = 0, openCount = 0, closeCount = 0;
		helpers.parseString('<foo><!doctype html></foo>', {
			openElement: function(name) {
				name.should.equal('foo');
				openCount++;
			},
			closeElement: function(name) {
				name.should.equal('foo');
				closeCount++;
			},
			docType: function(value) {
				openCount.should.equal(1);
				closeCount.should.equal(0);
				value.should.equal('html');
				docTypeCount++;
			}
		});

		docTypeCount.should.equal(1);
		openCount.should.equal(1);
		closeCount.should.equal(1);
	});

	it('with line breaks', function() {
		var docTypeCount = 0;
		helpers.parseString('<!doctype foo\nbar>', {
			docType: function(value) {
				value.should.equal('foo\nbar');
				docTypeCount++;
			}
		});

		docTypeCount.should.equal(1);
	});

	it('are case insensitive', function() {
		var docTypeCount = 0;
		helpers.parseString('<!DoCtyPE html>', {
			docType: function(value) {
				value.should.equal('html');
				docTypeCount++;
			}
		});

		docTypeCount.should.equal(1);
	});

});