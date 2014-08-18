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
    setUp: function (done) {
        // setup here
        done();
    },
    'HTML5 DOCTYPE': function (test) {
        test.expect(4);
        test.deepEqual(bootlint.lintHtml(utf8Fixture('doctype/missing.html')),
            ["Document is missing a DOCTYPE declaration"],
            'should complain when no doctype declaration is present.');
        test.deepEqual(bootlint.lintHtml(utf8Fixture('doctype/html4.html')),
            ["Document declares a non-HTML5 DOCTYPE"],
            'should complain when the HTML4 doctype is used.');
        test.deepEqual(bootlint.lintHtml(utf8Fixture('doctype/html5-normal.html')),
            [],
            'should not complain when the normal simple HTML5 doctype is used.');
        test.deepEqual(bootlint.lintHtml(utf8Fixture('doctype/html5-legacy.html')),
            [],
            'should not complain when the legacy-compatibility HTML5 doctype is used.');
        test.done();
    },
    'UTF-8 charset meta tag': function (test) {
        test.expect(3);
        test.deepEqual(bootlint.lintHtml(utf8Fixture('charset/utf8.html')),
            [],
            'should not complain when UTF-8 charset <meta> tag is present.');
        test.deepEqual(bootlint.lintHtml(utf8Fixture('charset/missing.html')),
            ['<head> is missing UTF-8 charset <meta> tag'],
            'should complain when charset <meta> tag is missing.');
        test.deepEqual(bootlint.lintHtml(utf16Fixture('charset/not-utf8.html')),
            ['charset <meta> tag is specifying a legacy, non-UTF-8 charset'],
            'should complain when <meta> tag specifies non-UTF-8 charset.');
        test.done();
    },
    'X-UA-Compatible': function (test) {
        test.expect(2);
        test.deepEqual(bootlint.lintHtml(utf8Fixture('x-ua-compatible/present.html')),
            [],
            'should not complain when X-UA-Compatible <meta> tag is present.');
        test.deepEqual(bootlint.lintHtml(utf8Fixture('x-ua-compatible/missing.html')),
            ["<head> is missing X-UA-Compatible <meta> tag that disables old IE compatibility modes"],
            'should complain when X-UA-Compatible <meta> tag is missing.');
        test.done();
    },
    'Bootstrap v2': function (test) {
        test.expect(1);
        test.deepEqual(bootlint.lintHtml(utf8Fixture('bs-v2.html')),
            [
                "Found one or more uses of outdated Bootstrap v2 `.spanN` grid classes",
                "Only columns (.col-*-*) may be children of `.row`s"
            ],
            'should complain when Bootstrap v2 grid classes are present.');
        test.done();
    },
    'rows outside containers': function (test) {
        test.expect(3);
        test.deepEqual(bootlint.lintHtml(utf8Fixture('containers/fixed.html')),
            [],
            'should not complain when rows are within fixed containers.');
        test.deepEqual(bootlint.lintHtml(utf8Fixture('containers/fluid.html')),
            [],
            'should not complain when rows are within fluid containers.');
        test.deepEqual(bootlint.lintHtml(utf8Fixture('containers/missing.html')),
            ["Found one or more `.row`s that were not children of a `.container` or `.container-fluid`"],
            'should complain when a row is not within a container.');
        test.done();
    },
    'nested containers': function (test) {
        test.expect(4);
        test.deepEqual(bootlint.lintHtml(utf8Fixture('containers/nested-fixed-fixed.html')),
            ["Containers (`.container` and `.container-fluid`) are not nestable"],
            'should complain when a container is within a container.');
        test.deepEqual(bootlint.lintHtml(utf8Fixture('containers/nested-fixed-fluid.html')),
            ["Containers (`.container` and `.container-fluid`) are not nestable"],
            'should complain when a container is within a container.');
        test.deepEqual(bootlint.lintHtml(utf8Fixture('containers/nested-fluid-fluid.html')),
            ["Containers (`.container` and `.container-fluid`) are not nestable"],
            'should complain when a container is within a container.');
        test.deepEqual(bootlint.lintHtml(utf8Fixture('containers/nested-fluid-fixed.html')),
            ["Containers (`.container` and `.container-fluid`) are not nestable"],
            'should complain when a container is within a container.');
        test.done();
    },
    'viewport meta tag': function (test) {
        test.expect(2);
        test.deepEqual(bootlint.lintHtml(utf8Fixture('viewport/present.html')),
            [],
            'should not complain when viewport <meta> tag is present');
        test.deepEqual(bootlint.lintHtml(utf8Fixture('viewport/missing.html')),
            ["<head> is missing viewport <meta> tag that enables responsiveness"],
            'should complain when viewport <meta> tag is missing.');
        test.done();
    },
    'row and column classes on same element': function (test) {
        test.expect(1);
        test.deepEqual(bootlint.lintHtml(utf8Fixture('row-col-same-elem.html')),
            ["Found both `.row` and `.col-*-*` used on the same element"],
            'should complain when .row and .col-*-* used on the same element.');
        test.done();
    },
    'remote modals': function (test) {
        test.expect(1);
        test.deepEqual(bootlint.lintHtml(utf8Fixture('modal-remote.html')),
            ["Found one or more modals using the deprecated `remote` option"],
            'should complain when remote modals are present.');
        test.done();
    },
    'jQuery': function (test) {
        test.expect(2);
        test.deepEqual(bootlint.lintHtml(utf8Fixture('jquery/present.html')),
            [],
            'should not complain when jQuery is present.');
        test.deepEqual(bootlint.lintHtml(utf8Fixture('jquery/missing.html')),
            ["Unable to locate jQuery, which is required for Bootstrap's JavaScript plugins to work"],
            'should complain when jQuery appears to be missing.');
        test.done();
    },
    'bootstrap[.min].js': function (test) {
        test.expect(2);
        test.deepEqual(bootlint.lintHtml(utf8Fixture('js/both.html')),
            ["Only one copy of Bootstrap's JS should be included; currently the webpage includes both bootstrap.js and bootstrap.min.js"],
            'should complain when both bootstrap.js and bootstrap.min.js are included.');
        test.deepEqual(bootlint.lintHtml(utf8Fixture('js/one.html')),
            [],
            'should not complain when only 1 of bootstrap.js and bootstrap.min.js is included.');
        test.done();
    },
    'input groups with impermissible kind of form control': function (test) {
        test.expect(3);
        test.deepEqual(bootlint.lintHtml(utf8Fixture('input-group/textarea.html')),
            ["`.input-group` contains a <textarea>; only text-based <input>s are permitted in an `.input-group`"],
            'should complain about input groups with a <textarea> form control');
        test.deepEqual(bootlint.lintHtml(utf8Fixture('input-group/select.html')),
            ["`.input-group` contains a <select>; this should be avoided as <select>s cannot be fully styled in WebKit browsers"],
            'should complain about input groups with a <select> form control');
        test.deepEqual(bootlint.lintHtml(utf8Fixture('input-group/valid.html')),
            [],
            'should not complain about input groups with text-based <input>s.');
        test.done();
    },
    'tooltips and popovers on disabled elements': function (test) {
        test.expect(1);
        test.deepEqual(bootlint.lintHtml(utf8Fixture('tooltips/on-disabled-elems.html')),
            ["Tooltips and popovers on disabled elements cannot be triggered by user interaction unless the element becomes enabled." +
            " To have tooltips and popovers be triggerable by the user even when their associated element is disabled," +
            " put the disabled element inside a wrapper <div> and apply the tooltip or popover to the wrapper <div> instead."],
            'should complain about tooltips and popovers on disabled elements.');
        test.done();
    },
    'tooltips and popovers within button groups should have their container set to body': function (test) {
        test.expect(1);
        test.deepEqual(bootlint.lintHtml(utf8Fixture('tooltips/in-btn-groups.html')),
            ["Tooltips and popovers within button groups should have their `container` set to 'body'. Found tooltips/popovers that might lack this setting."],
            'should complain when `data-*`-based tooltips or popovers lack `data-container="body"`.');
        test.done();
    },
    'btn/input sizing used without input-group-* size':function (test) {
        test.expect(1);
        test.deepEqual(bootlint.lintHtml(utf8Fixture('input-group/missing-input-group-sizing.html')),
            ["Button and input sizing within `.input-group`s can causes issues. Instead, use relative form sizing classes `.input-group-lg` or `.input-group-sm`"],
            'should complain when an input/btn sizes are used within input-group.');
        test.done();
    },
    'input groups with multiple form controls': function (test) {
        test.expect(1);
        test.deepEqual(bootlint.lintHtml(utf8Fixture('input-group/multiple-form-controls.html')),
            ["Input groups cannot contain multiple `.form-control`s"],
            'should complain when an input group contains multiple form controls.');
        test.done();
    },
    'mixing input groups with form groups': function (test) {
        test.expect(1);
        test.deepEqual(bootlint.lintHtml(utf8Fixture('input-group/mixed-with-form-group.html')),
            [".input-group and .form-group cannot be used directly on the same element. Instead, nest the .input-group within the .form-group"],
            'should complain when .input-group and .form-group are used on the same element.');
        test.done();
    },
    'mixing input groups with grid columns': function (test) {
        test.expect(1);
        test.deepEqual(bootlint.lintHtml(utf8Fixture('input-group/mixed-with-grid-col.html')),
            [".input-group and .col-*-* cannot be used directly on the same element. Instead, nest the .input-group within the .col-*-*"],
            'should complain when an input group has a grid column class on it.');
        test.done();
    },
    'non-column children of rows': function (test) {
        test.expect(1);
        test.deepEqual(bootlint.lintHtml(utf8Fixture('non-col-row-children.html')),
            ["Only columns (.col-*-*) may be children of `.row`s"],
            'should complain when rows have non-column children.');
        test.done();
    },
    'multiple columns on the same side of an input group': function (test) {
        test.expect(5);
        test.deepEqual(bootlint.lintHtml(utf8Fixture('input-group/multiple-add-on-left.html')),
            ["Having multiple add-ons on a single side of an input group is not supported"],
            'should complain when multiple normal add-ons are on the left side of an input group.');
        test.deepEqual(bootlint.lintHtml(utf8Fixture('input-group/multiple-add-on-right.html')),
            ["Having multiple add-ons on a single side of an input group is not supported"],
            'should complain when multiple normal add-ons are on the right side of an input group.');
        test.deepEqual(bootlint.lintHtml(utf8Fixture('input-group/multiple-btn-add-on-left.html')),
            ["Having multiple add-ons on a single side of an input group is not supported"],
            'should complain when multiple button add-ons are on the left side of an input group.');
        test.deepEqual(bootlint.lintHtml(utf8Fixture('input-group/multiple-btn-add-on-right.html')),
            ["Having multiple add-ons on a single side of an input group is not supported"],
            'should complain when multiple button add-ons are on the right side of an input group.');
        test.deepEqual(bootlint.lintHtml(utf8Fixture('input-group/multiple-mixed-add-on-left.html')),
            ["Having multiple add-ons on a single side of an input group is not supported"],
            'should complain when both a normal add-on and a button add-on are on the left side of an input group.');
        test.done();
    },
    'incorrect markup for .checkbox, .radio, .checkbox-inline, and .radio-inline classes': function (test) {
        test.expect(7);

        test.deepEqual(bootlint.lintHtml(utf8Fixture('checkboxes-radios/valid.html')),
            [],
            'should not complain when correct radio and checkbox markup is used.');

        test.deepEqual(bootlint.lintHtml(utf8Fixture('checkboxes-radios/checkbox-block-bad.html')),
            ['Incorrect markup used with the `.checkbox` class. The correct markup structure is .checkbox>label>input[type="checkbox"]'],
            'should complain when invalid .checkbox markup is used.');
        test.deepEqual(bootlint.lintHtml(utf8Fixture('checkboxes-radios/radio-block-bad.html')),
            ['Incorrect markup used with the `.radio` class. The correct markup structure is .radio>label>input[type="radio"]'],
            'should complain when invalid .radio markup is used.');

        test.deepEqual(bootlint.lintHtml(utf8Fixture('checkboxes-radios/checkbox-inline-non-label.html')),
            [".checkbox-inline should only be used on <label> elements"],
            'should complain when .checkbox-inline is used on a non-<label> element.');
        test.deepEqual(bootlint.lintHtml(utf8Fixture('checkboxes-radios/radio-inline-non-label.html')),
            [".radio-inline should only be used on <label> elements"],
            'should complain when .radio-inline is used on a non-<label> element.');

        test.deepEqual(bootlint.lintHtml(utf8Fixture('checkboxes-radios/checkbox-inline-bad-structure.html')),
            ['Incorrect markup used with the `.checkbox-inline` class. The correct markup structure is label.checkbox-inline>input[type="checkbox"]'],
            'should complain when invalid .checkbox-inline markup is used.');
        test.deepEqual(bootlint.lintHtml(utf8Fixture('checkboxes-radios/radio-inline-bad-structure.html')),
            ['Incorrect markup used with the `.radio-inline` class. The correct markup structure is label.radio-inline>input[type="radio"]'],
            'should complain when invalid .radio-inline markup is used.');

        test.done();
    },

    '.active class and checked attribute for buttons plugin do not match': function (test) {
        test.expect(3);
        test.deepEqual(bootlint.lintHtml(utf8Fixture('buttons-plugin/valid.html')),
            [],
            'should not complain when .active and checked correspond correctly.');
        test.deepEqual(bootlint.lintHtml(utf8Fixture('buttons-plugin/checkbox-bad.html')),
            [".active class used without the `checked` attribute (or vice-versa) in a button group using the button.js plugin"],
            'should complain when .active and checked do not correspond correctly in a checkbox button group.');
        test.deepEqual(bootlint.lintHtml(utf8Fixture('buttons-plugin/radio-bad.html')),
            [".active class used without the `checked` attribute (or vice-versa) in a button group using the button.js plugin"],
            'should complain when .active and checked do not correspond correctly in a radio button group.');
        test.done();
    },
    'modals within other components': function (test) {
        test.expect(1);
        test.deepEqual(bootlint.lintHtml(utf8Fixture('modal/within-table.html')),
            ["Modal markup should not be placed within other components, so as to avoid the component's styles interfering with the modal's appearance or functionality"],
            'should complain when a modal is placed within a `.table`.');
        test.done();
    }
};
