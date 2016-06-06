var should = require('should');
var helpers = require('./helpers');

describe('dataElement', function () {
    it('at beginning of document', function() {
        var dataCount = 0;
        helpers.parseString('<?php echo "<html></html>" ?>', {
            php: function(value) {
                value.should.equal(' echo "<html></html>" ');
                dataCount++;
            }
        }, {
            dataElements: {
                php: {
                    start: '?php',
                    end: '?>'
                }
            }
        });

        dataCount.should.equal(1);
    });

    it('in middle of document', function() {
        var dataCount = 0, openCount = 0, closeCount = 0;
        helpers.parseString('<foo><?= "<div>$var</div>" ?></foo>', {
            openElement: function(name) {
                name.should.equal('foo');
                openCount++;
            },
            closeElement: function(name) {
                name.should.equal('foo');
                closeCount++;
            },
            phpEcho: function(value) {
                openCount.should.equal(1);
                closeCount.should.equal(0);
                value.should.equal(' "<div>$var</div>" ');
                dataCount++;
            }
        }, {
            dataElements: {
                phpEcho: {
                    start: '?=',
                    end: '?>'
                }
            }
        });

        dataCount.should.equal(1);
        openCount.should.equal(1);
        closeCount.should.equal(1);
    });

    it('with line breaks', function() {
        var dataCount = 0;
        helpers.parseString('<?php\nfoo\n?>', {
            php: function(value) {
                value.should.equal('\nfoo\n');
                dataCount++;
            }
        }, {
            dataElements: {
                php: {
                    start: '?php',
                    end: '?>'
                }
            }
        });

        dataCount.should.equal(1);
    });
});