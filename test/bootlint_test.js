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

exports['bootlint'] = {
    setUp: function(done) {
        // setup here
        done();
    },
    'HTML5 DOCTYPE': function (test) {
        test.expect(4);
        test.deepEqual(bootlint.lint(utf8Fixture('doctype/missing.html')),
            ["Document is missing a DOCTYPE declaration"],
            'should complain when no doctype declaration is present.');
        test.deepEqual(bootlint.lint(utf8Fixture('doctype/html4.html')),
            ["Document declares a non-HTML5 DOCTYPE"],
            'should complain when the HTML4 doctype is used.');
        test.deepEqual(bootlint.lint(utf8Fixture('doctype/html5-normal.html')),
            [],
            'should not complain when the normal simple HTML5 doctype is used.');
        test.deepEqual(bootlint.lint(utf8Fixture('doctype/html5-legacy.html')),
            [],
            'should not complain when the legacy-compatibility HTML5 doctype is used.');
        test.done();
    },
    'UTF-8 charset meta tag': function (test) {
        test.expect(3);
        test.deepEqual(bootlint.lint(utf8Fixture('charset/utf8.html')),
            [],
            'should not complain when UTF-8 charset <meta> tag is present.');
        test.deepEqual(bootlint.lint(utf8Fixture('charset/missing.html')),
            ['<head> is missing UTF-8 charset <meta> tag'],
            'should complain when charset <meta> tag is missing.');
        test.deepEqual(bootlint.lint(utf16Fixture('charset/not-utf8.html')),
            ['charset <meta> tag is specifying a legacy, non-UTF-8 charset'],
            'should complain when <meta> tag specifies non-UTF-8 charset.');
        test.done();
    },
    'X-UA-Compatible': function (test) {
        test.expect(2);
        test.deepEqual(bootlint.lint(utf8Fixture('x-ua-compatible/present.html')),
            [],
            'should not complain when X-UA-Compatible <meta> tag is present.');
        test.deepEqual(bootlint.lint(utf8Fixture('x-ua-compatible/missing.html')),
            ["<head> is missing X-UA-Compatible <meta> tag that disables old IE compatibility modes"],
            'should complain when X-UA-Compatible <meta> tag is missing.');
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
            ["Found one or more `.row`s that were not children of a `.container` or `.container-fluid`"],
            'should complain when a row is not within a container.');
        test.done();
    },
    'viewport meta tag': function (test) {
        test.expect(2);
        test.deepEqual(bootlint.lint(utf8Fixture('viewport/present.html')),
            [],
            'should not complain when viewport <meta> tag is present');
        test.deepEqual(bootlint.lint(utf8Fixture('viewport/missing.html')),
            ["<head> is missing viewport <meta> tag that enables responsiveness"],
            'should complain when viewport <meta> tag is missing.');
        test.done();
    },
    'row and column classes on same element': function (test) {
        test.expect(1);
        test.deepEqual(bootlint.lint(utf8Fixture('row-col-same-elem.html')),
            ["Found both `.row` and `.col-*-*` used on the same element"],
            'should complain when .row and .col-*-* used on the same element.');
        test.done();
    },
    'remote modals': function (test) {
        test.expect(1);
        test.deepEqual(bootlint.lint(utf8Fixture('modal-remote.html')),
            ["Found one or more modals using the deprecated `remote` option"],
            'should complain when remote modals are present.');
        test.done();
    },
    'jQuery': function (test) {
        test.expect(2);
        test.deepEqual(bootlint.lint(utf8Fixture('jquery/present.html')),
            [],
            'should not complain when jQuery is present.');
        test.deepEqual(bootlint.lint(utf8Fixture('jquery/missing.html')),
            ["Unable to locate jQuery, which is required for Bootstrap's JavaScript plugins to work"],
            'should complain when jQuery appears to be missing.');
        test.done();
    },
    'bootstrap[.min].js': function (test) {
        test.expect(2);
        test.deepEqual(bootlint.lint(utf8Fixture('js/both.html')),
            ["Only one copy of Bootstrap's JS should be included; currently the webpage includes both bootstrap.js and bootstrap.min.js"],
            'should complain when both bootstrap.js and bootstrap.min.js are included.');
        test.deepEqual(bootlint.lint(utf8Fixture('js/one.html')),
            [],
            'should not complain when only 1 of bootstrap.js and bootstrap.min.js is included.');
        test.done();
    },
    'input groups with impermissible kind of form control': function (test) {
        test.expect(3);
        test.deepEqual(bootlint.lint(utf8Fixture('input-group/textarea.html')),
            ["`.input-group` contains a <textarea>; only text-based <input>s are permitted in an `.input-group`"],
            'should complain about input groups with a <textarea> form control');
        test.deepEqual(bootlint.lint(utf8Fixture('input-group/select.html')),
            ["`.input-group` contains a <select>; this should be avoided as <select>s cannot be fully styled in WebKit browsers"],
            'should complain about input groups with a <select> form control');
        test.deepEqual(bootlint.lint(utf8Fixture('input-group/valid.html')),
            [],
            'should not complain about input groups with text-based <input>s');
        test.done();
    }
};
