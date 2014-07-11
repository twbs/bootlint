'use strict';

var bootlint = require('../src/bootlint.js');
var fs = require('fs');
function _fixtureNameToFilepath(name) {
    return __dirname + '/fixtures/' + name;
}
function utf8Fixture(name) {
    return fs.readFileSync(_fixtureNameToFilepath(name), {encoding: 'utf8'});
}
function utf16Fixture(name) {
    return fs.readFileSync(_fixtureNameToFilepath(name), {encoding: 'utf16le'});
}
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

exports['awesome'] = {
    setUp: function(done) {
        // setup here
        done();
    },
    'UTF-8 charset meta tag': function (test) {
        test.expect(3);
        test.deepEqual(bootlint.lint(utf8Fixture('charset/utf8.html')),
            [],
            'should not complain when UTF-8 charset meta tag is present.');
        test.deepEqual(bootlint.lint(utf8Fixture('charset/missing.html')),
            ['<head> is missing UTF-8 charset <meta> tag'],
            'should complain when charset meta tag is missing.');
        test.deepEqual(bootlint.lint(utf16Fixture('charset/not-utf8.html')),
            ['charset meta tag is specifying a legacy, non-UTF-8 charset'],
            'should complain when meta tag specifies non-UTF-8 charset.');
        test.done();
    },
    'X-UA-Compatible': function (test) {
        test.expect(2);
        test.deepEqual(bootlint.lint(utf8Fixture('x-ua-compatible/present.html')),
            [],
            'should not complain when X-UA-Compatible meta tag is present.');
        test.deepEqual(bootlint.lint(utf8Fixture('x-ua-compatible/missing.html')),
            ["<head> is missing X-UA-Compatible meta tag that disables old IE compatibility modes"],
            'should complain when X-UA-Compatible meta tag is missing.');
        test.done();
    },
    'Bootstrap v2': function (test) {
        test.expect(1);
        test.deepEqual(bootlint.lint(utf8Fixture('bs-v2.html')),
            ["Found one or more uses of outdated Bootstrap v2 `.spanN` grid classes"],
            'should complain when Bootstrap v2 grid classes are present.');
        test.done();
    },
    'containers': function (test) {
        test.expect(3);
        test.deepEqual(bootlint.lint(utf8Fixture('containers/fixed.html')),
            [],
            'should not complain when rows are within fixed containers.');
        test.deepEqual(bootlint.lint(utf8Fixture('containers/fluid.html')),
            [],
            'should not complain when rows are within fluid containers.');
        test.deepEqual(bootlint.lint(utf8Fixture('containers/missing.html')),
            ["Found one or more `.row`s that were not children of a `.container` or `.container-fluid`."],
            'should complain when a row is not within a container.');
        test.done();
    }
};
