var should = require('should');
var helpers = require('./helpers');

describe('dataElement', function () {
    it('as string', function() {
        var dataCount = 0;
        helpers.parseString('<?php echo "<html></html>" ?>', {
            php: function(value) {
                value.should.equal(' echo "<html></html>" ');
                dataCount++;
            }
        }, {
            dataElements: {
                php: {
                    start: '<?php',
                    end: '?>'
                }
            }
        });

        dataCount.should.equal(1);
    });

    it('as regex', function() {
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
                    start: /^<\?=/,
                    end: /\?>/
                }
            }
        });

        dataCount.should.equal(1);
        openCount.should.equal(1);
        closeCount.should.equal(1);
    });

    it('as function', function() {
        var dataCount = 0;
        helpers.parseString('<!-- test --><?php\nfoo\n?>', {
            comment: function (value) {
                value.should.equal(' test ');
                dataCount++;
            },
            php: function(value) {
                value.should.deepEqual({
                    value: '\nfoo\n',
                    length: '\nfoo\n'.length
                });
                dataCount++;
            }
        }, {
            dataElements: {
                php: {
                    start: function (substring) {
                        return substring.slice(0, 5) === '<?php' ? 5 : -1;
                    },
                    data: function (substring) {
                        substring.should.equal('\nfoo\n?>');
                        dataCount++;
                        var index = substring.indexOf('?>');
                        return {
                            value: substring.slice(0, index),
                            length: substring.slice(0, index).length
                        };
                    },
                    end: function (substring) {
                        substring.should.equal('?>');
                        dataCount++;
                        return 2;
                    }
                }
            }
        });

        dataCount.should.equal(4);
    });
});