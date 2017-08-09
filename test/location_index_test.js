'use strict';

var _location = require('../src/location.js');
var Location = _location.Location;
var LocationIndex = _location.LocationIndex;

/*
    ======== A Handy Little Nodeunit Reference ========
    https://github.com/caolan/nodeunit

    Test methods:
        test.expect(numAssertions)
        test.done()
    Test assertions:
        test.ok(value, [message])
        test.deepEqual(actual, expected, [message])
        test.notDeepEqual(actual, expected, [message])
        test.strictEqual(actual, expected, [message])
        test.notStrictEqual(actual, expected, [message])
        test.throws(block, [error], [message])
        test.doesNotThrow(block, [error], [message])
        test.ifError(value)
*/

var EXAMPLE = [
    /*0:*/'0123456789\n',
    /*1:*/'\n',
    /*2:*/'ABCDEFGHIJ\n',
    /*3:*/'QWE\n',
    /*4:*/'RTYUIOP\n'
].join('');
var EXAMPLE_WITHOUT_TERMINATOR = EXAMPLE.substring(0, EXAMPLE.length - 1);

exports.bootlint = {
    'LocationIndex with string terminated by a newline': function (test) {
        var index = new LocationIndex(EXAMPLE);
        test.expect(10);
        test.strictEqual(index.locationOf(1000), null, 'should give null when the code unit index is too high.');
        test.strictEqual(index.locationOf(-1), null, 'should give null when the code unit index is too low.');
        test.deepEqual(index.locationOf(0), new Location(0, 0), 'should give the right location for the start of the string.');
        test.deepEqual(index.locationOf(33), new Location(4, 6), 'should give the right location for the end of the string.');
        test.deepEqual(index.locationOf(34), new Location(4, 7), 'should give the right location for the true end of the string.');
        test.deepEqual(index.locationOf(23), new Location(3, 0), 'should give the right location for the start of a line.');
        test.deepEqual(index.locationOf(21), new Location(2, 9), 'should give the right location for the end of a line.');
        test.deepEqual(index.locationOf(22), new Location(2, 10), 'should give the right location for the true end of a line.');
        test.deepEqual(index.locationOf(5), new Location(0, 5), 'should give the right location for the middle of a line.');
        var triples = [
            [0, 0, 11],
            [1, 11, 12],
            [2, 12, 23],
            [3, 23, 27],
            [4, 27, 35]
        ];
        test.deepEqual(index._lineStartEndTriples, triples, 'should internally generate the right extents data.');
        test.done();
    },
    'LocationIndex with string not terminated by a newline': function (test) {
        var index = new LocationIndex(EXAMPLE_WITHOUT_TERMINATOR);
        test.expect(10);
        // tests are identical to the non-terminated case
        test.strictEqual(index.locationOf(1000), null, 'should give null when the code unit index is too high.');
        test.strictEqual(index.locationOf(-1), null, 'should give null when the code unit index is too low.');
        test.deepEqual(index.locationOf(0), new Location(0, 0), 'should give the right location for the start of the string.');
        test.deepEqual(index.locationOf(33), new Location(4, 6), 'should give the right location for the (true) end of the string.');// relevant
        test.deepEqual(index.locationOf(34), new Location(4, 7), 'should give the right location for the true end of the string.');
        test.deepEqual(index.locationOf(23), new Location(3, 0), 'should give the right location for the start of a line.');
        test.deepEqual(index.locationOf(21), new Location(2, 9), 'should give the right location for the end of a line.');
        test.deepEqual(index.locationOf(22), new Location(2, 10), 'should give the right location for the true end of a line.');
        test.deepEqual(index.locationOf(5), new Location(0, 5), 'should give the right location for the middle of a line.');
        var triples = [
            [0, 0, 11],
            [1, 11, 12],
            [2, 12, 23],
            [3, 23, 27],
            [4, 27, 35]
        ];
        test.deepEqual(index._lineStartEndTriples, triples, 'should internally generate the right extents data.');
        test.done();
    }
};
