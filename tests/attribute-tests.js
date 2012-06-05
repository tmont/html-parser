var should = require('should');
var helpers = require('./helpers');

describe('attributes', function() {
	it('with value, without quotes', function() {
		var openCount = 0, attrCount = 0;
		helpers.parseString('<foo bar=baz>', {
			openElement: function(name) {
				name.should.equal('foo');
				openCount++;
			},

			attribute: function(name, value) {
				name.should.equal('bar');
				value.should.equal('baz');
				attrCount++;
			}
		});

		openCount.should.equal(1);
		attrCount.should.equal(1);
	});

	it('with value, with double quotes', function() {
		var openCount = 0, attrCount = 0;
		helpers.parseString('<foo bar="baz">', {
			openElement: function(name) {
				name.should.equal('foo');
				openCount++;
			},

			attribute: function(name, value) {
				name.should.equal('bar');
				value.should.equal('baz');
				attrCount++;
			}
		});

		openCount.should.equal(1);
		attrCount.should.equal(1);
	});

	it('with value, with single quotes', function() {
		var openCount = 0, attrCount = 0;
		helpers.parseString('<foo bar=\'baz\'>', {
			openElement: function(name) {
				name.should.equal('foo');
				openCount++;
			},

			attribute: function(name, value) {
				name.should.equal('bar');
				value.should.equal('baz');
				attrCount++;
			}
		});

		openCount.should.equal(1);
		attrCount.should.equal(1);
	});

	it('without value', function() {
		var openCount = 0, attrCount = 0;
		helpers.parseString('<foo bar baz>', {
			openElement: function(name) {
				name.should.equal('foo');
				openCount++;
			},

			attribute: function(name, value) {
				name.should.equal(attrCount === 0 ? 'bar' : 'baz');
				should.not.exist(value);
				attrCount++;
			}
		});

		openCount.should.equal(1);
		attrCount.should.equal(2);
	});

	it('with value, without quotes should be terminated by line break', function() {
		var openCount = 0, attrCount = 0;
		helpers.parseString('<foo bar\n>', {
			openElement: function(name) {
				name.should.equal('foo');
				openCount++;
			},

			attribute: function(name, value) {
				name.should.equal('bar');
				should.not.exist(value);
				attrCount++;
			}
		});

		openCount.should.equal(1);
		attrCount.should.equal(1);
	});

	it('with and without quotes in same element', function() {
		var openCount = 0, attrCount = 0;
		helpers.parseString('<foo width=0 height="12">', {
			openElement: function(name) {
				name.should.equal('foo');
				openCount++;
			},

			attribute: function(name, value) {
				name.should.equal(attrCount === 0 ? 'width' : 'height');
				value.should.equal(attrCount === 0 ? '0' : '12');
				attrCount++;
			}
		});

		openCount.should.equal(1);
		attrCount.should.equal(2);
	});

	it('with value and funky whitespace', function() {
		var openCount = 0, attrCount = 0;
		helpers.parseString('<foo bar = "baz" >', {
			openElement: function(name) {
				name.should.equal('foo');
				openCount++;
			},

			attribute: function(name, value) {
				name.should.equal('bar');
				value.should.equal('baz');
				attrCount++;
			}
		});

		openCount.should.equal(1);
		attrCount.should.equal(1);
	});

	it('with value on different lines', function() {
		var openCount = 0, attrCount = 0;
		helpers.parseString('<foo bar \n=\n "baz" >', {
			openElement: function(name) {
				name.should.equal('foo');
				openCount++;
			},

			attribute: function(name, value) {
				name.should.equal('bar');
				value.should.equal('baz');
				attrCount++;
			}
		});

		openCount.should.equal(1);
		attrCount.should.equal(1);
	});

	it('with colons', function() {
		var openCount = 0, attrCount = 0;
		helpers.parseString('<foo bar:baz="bat">', {
			openElement: function(name) {
				name.should.equal('foo');
				openCount++;
			},

			attribute: function(name, value) {
				name.should.equal('bar:baz');
				value.should.equal('bat');
				attrCount++;
			}
		});

		openCount.should.equal(1);
		attrCount.should.equal(1);
	});
});