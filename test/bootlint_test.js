/*eslint-env node */
/*eslint no-process-env: 0 */

'use strict';

var bootlint = (process.env.BOOTLINT_COV === '1') ? require('../src-cov/bootlint.js') : require('../src/bootlint.js');
var fs = require('fs');
var path = require('path');

function _fixtureNameToFilepath(name) {
    return path.join(__dirname, '/fixtures/', name);
}
function utf8Fixture(name) {
    return fs.readFileSync(_fixtureNameToFilepath(name), {encoding: 'utf8'});
}
function utf16Fixture(name) {
    return fs.readFileSync(_fixtureNameToFilepath(name), {encoding: 'utf16le'});
}
function lintHtml(html, disabledIds) {
    var lints = [];
    var reporter = function (lint) {
        lints.push(lint.message);
    };
    bootlint.lintHtml(html, reporter, disabledIds || []);
    return lints;
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

exports.bootlint = {
    setUp: function (done) {
        // setup here
        done();
    },
    'HTML5 DOCTYPE': function (test) {
        test.expect(4);
        test.deepEqual(lintHtml(utf8Fixture('doctype/missing.html')),
            ["Document is missing a DOCTYPE declaration"],
            'should complain when no doctype declaration is present.');
        test.deepEqual(lintHtml(utf8Fixture('doctype/html4.html')),
            ["Document declares a non-HTML5 DOCTYPE"],
            'should complain when the HTML4 doctype is used.');
        test.deepEqual(lintHtml(utf8Fixture('doctype/html5-normal.html')),
            [],
            'should not complain when the normal simple HTML5 doctype is used.');
        test.deepEqual(lintHtml(utf8Fixture('doctype/html5-legacy.html')),
            [],
            'should not complain when the legacy-compatibility HTML5 doctype is used.');
        test.done();
    },
    'disabling lint checks': function (test) {
        test.expect(1);
        test.deepEqual(lintHtml(utf8Fixture('bs-v2.html'), ['E002', 'E013']),
            [],
            'should complain when Bootstrap v2 grid classes are present.');
        test.done();
    },
    'UTF-8 charset meta tag': function (test) {
        test.expect(3);
        test.deepEqual(lintHtml(utf8Fixture('charset/utf8.html')),
            [],
            'should not complain when UTF-8 charset <meta> tag is present.');
        test.deepEqual(lintHtml(utf8Fixture('charset/missing.html')),
            ['`<head>` is missing UTF-8 charset `<meta>` tag'],
            'should complain when charset <meta> tag is missing.');
        test.deepEqual(lintHtml(utf16Fixture('charset/not-utf8.html')),
            ['charset `<meta>` tag is specifying a legacy, non-UTF-8 charset'],
            'should complain when <meta> tag specifies non-UTF-8 charset.');
        test.done();
    },
    'X-UA-Compatible': function (test) {
        test.expect(3);
        test.deepEqual(lintHtml(utf8Fixture('x-ua-compatible/present.html')),
            [],
            'should not complain when X-UA-Compatible <meta> tag is present.');
        test.deepEqual(lintHtml(utf8Fixture('x-ua-compatible/lowercase.html')),
            [],
            'should not complain when X-UA-Compatible <meta> tag is present but lowercased.');
        test.deepEqual(lintHtml(utf8Fixture('x-ua-compatible/missing.html')),
            ["`<head>` is missing X-UA-Compatible `<meta>` tag that disables old IE compatibility modes"],
            'should complain when X-UA-Compatible <meta> tag is missing.');
        test.done();
    },
    'Bootstrap v2': function (test) {
        test.expect(1);
        test.deepEqual(lintHtml(utf8Fixture('bs-v2.html')),
            [
                "Found one or more uses of outdated Bootstrap v2 `.spanN` grid classes",
                "Only columns (`.col-*-*`) may be children of `.row`s"
            ],
            'should complain when Bootstrap v2 grid classes are present.');
        test.done();
    },
    'rows outside containers': function (test) {
        test.expect(5);
        test.deepEqual(lintHtml(utf8Fixture('containers/fixed.html')),
            [],
            'should not complain when rows are descendants of fixed containers.');
        test.deepEqual(lintHtml(utf8Fixture('containers/fluid.html')),
            [],
            'should not complain when rows are descendants of fluid containers.');
        test.deepEqual(lintHtml(utf8Fixture('containers/columns.html')),
            [],
            'should not complain when rows are children of columns.');
        test.deepEqual(lintHtml(utf8Fixture('containers/missing.html')),
            ["Found one or more `.row`s that were not children of a grid column or descendants of a `.container` or `.container-fluid`"],
            'should complain when a row is not a descendant of a container.');
        test.deepEqual(lintHtml(utf8Fixture('containers/ancestor.html')),
            [],
            'should not complain when rows are descendants (but not children) of containers.');
        test.done();
    },
    'nested containers': function (test) {
        test.expect(4);
        test.deepEqual(lintHtml(utf8Fixture('containers/nested-fixed-fixed.html')),
            ["Containers (`.container` and `.container-fluid`) are not nestable"],
            'should complain when a container is within a container.');
        test.deepEqual(lintHtml(utf8Fixture('containers/nested-fixed-fluid.html')),
            ["Containers (`.container` and `.container-fluid`) are not nestable"],
            'should complain when a container is within a container.');
        test.deepEqual(lintHtml(utf8Fixture('containers/nested-fluid-fluid.html')),
            ["Containers (`.container` and `.container-fluid`) are not nestable"],
            'should complain when a container is within a container.');
        test.deepEqual(lintHtml(utf8Fixture('containers/nested-fluid-fixed.html')),
            ["Containers (`.container` and `.container-fluid`) are not nestable"],
            'should complain when a container is within a container.');
        test.done();
    },
    'viewport meta tag': function (test) {
        test.expect(2);
        test.deepEqual(lintHtml(utf8Fixture('viewport/present.html')),
            [],
            'should not complain when viewport <meta> tag is present');
        test.deepEqual(lintHtml(utf8Fixture('viewport/missing.html')),
            ["`<head>` is missing viewport `<meta>` tag that enables responsiveness"],
            'should complain when viewport <meta> tag is missing.');
        test.done();
    },
    'row and column classes on same element': function (test) {
        test.expect(1);
        test.deepEqual(lintHtml(utf8Fixture('grid/row-col-same-elem.html')),
            [
                "Found both `.row` and `.col-*-*` used on the same element",
                'Columns (`.col-*-*`) can only be children of `.row`s or `.form-group`s'
            ],
            'should complain when .row and .col-*-* are used on the same element.');
        test.done();
    },
    'row and container classes on same element': function (test) {
        test.expect(2);
        test.deepEqual(lintHtml(utf8Fixture('containers/fixed-row-same-elem.html')),
            ["Found one or more `.row`s that were not children of a grid column or descendants of a `.container` or `.container-fluid`"],
            'should complain when .row and .container are used on the same element.');
        test.deepEqual(lintHtml(utf8Fixture('containers/fluid-row-same-elem.html')),
            ["Found one or more `.row`s that were not children of a grid column or descendants of a `.container` or `.container-fluid`"],
            'should complain when .row and .container-fluid are used on the same element.');
        test.done();
    },
    'remote modals': function (test) {
        test.expect(1);
        test.deepEqual(lintHtml(utf8Fixture('modal/remote.html')),
            ["Found one or more modals using the deprecated `remote` option"],
            'should complain when remote modals are present.');
        test.done();
    },
    'jQuery': function (test) {
        test.expect(5);
        test.deepEqual(lintHtml(utf8Fixture('jquery/present.html')),
            [],
            'should not complain when jQuery is present.');
        test.deepEqual(lintHtml(utf8Fixture('jquery/jquery-plugin.html')),
            [],
            'should not complain when jQuery & a plugin is present.');
        test.deepEqual(lintHtml(utf8Fixture('jquery/old-url.html')),
            ["Found what might be an outdated version of jQuery; Bootstrap requires jQuery v1.9.1 or higher"],
            'should complain about old version of jQuery based on URL');
        test.deepEqual(lintHtml(utf8Fixture('jquery/missing.html')),
            ["Unable to locate jQuery, which is required for Bootstrap's JavaScript plugins to work"],
            "should complain when jQuery appears to be missing.");
        test.deepEqual(lintHtml(utf8Fixture('jquery/and_bs_js_both_missing.html')),
            ["Unable to locate jQuery, which is required for Bootstrap's JavaScript plugins to work; however, you might not be using Bootstrap's JavaScript"],
            "should complain differently when jQuery appears to be missing but Bootstrap's JS is also missing.");
        test.done();
    },
    'bootstrap[.min].js': function (test) {
        test.expect(4);
        test.deepEqual(lintHtml(utf8Fixture('js/both.html')),
            ["Only one copy of Bootstrap's JS should be included; currently the webpage includes both bootstrap.js and bootstrap.min.js"],
            'should complain when both bootstrap.js and bootstrap.min.js are included.');
        test.deepEqual(lintHtml(utf8Fixture('js/one.html')),
            [],
            'should not complain when only 1 of bootstrap.js and bootstrap.min.js is included.');
        test.deepEqual(lintHtml(utf8Fixture('js/similar.html')),
            [],
            'should not complain when only 1 of bootstrap.js and bootstrap.min.js is included but another JS file with "bootstrap" in its name is included.');
        test.deepEqual(lintHtml(utf8Fixture('js/weird.html')),
            ["Only one copy of Bootstrap's JS should be included; currently the webpage includes both bootstrap.js and bootstrap.min.js"],
            'should complain when both bootstrap.js and bootstrap.min.js are included, even when their URLs use fragments and query strings.');
        test.done();
    },
    'input groups with impermissible kind of form control': function (test) {
        test.expect(3);
        test.deepEqual(lintHtml(utf8Fixture('input-group/textarea.html')),
            ["`.input-group` contains a `<textarea>`; only text-based `<input>`s are permitted in an `.input-group`"],
            'should complain about input groups with a <textarea> form control');
        test.deepEqual(lintHtml(utf8Fixture('input-group/select.html')),
            ["`.input-group` contains a `<select>`; this should be avoided as `<select>`s cannot be fully styled in WebKit browsers"],
            'should complain about input groups with a <select> form control');
        test.deepEqual(lintHtml(utf8Fixture('input-group/valid.html')),
            [],
            'should not complain about input groups with text-based <input>s.');
        test.done();
    },
    'tooltips and popovers on disabled elements': function (test) {
        test.expect(1);
        test.deepEqual(lintHtml(utf8Fixture('tooltips/on-disabled-elems.html')),
            [
                "Tooltips and popovers on disabled elements cannot be triggered by user interaction unless the element becomes enabled." +
                " To have tooltips and popovers be triggerable by the user even when their associated element is disabled," +
                " put the disabled element inside a wrapper `<div>` and apply the tooltip or popover to the wrapper `<div>` instead.",
                'Using the `.disabled` class on a `<button>` or `<input>` only changes the appearance of the element. It doesn\'t prevent the user from interacting with the element (for example, clicking on it or focusing it). If you want to truly disable the element, use the `disabled` attribute instead.'
            ],
            'should complain about tooltips and popovers on disabled elements.');
        test.done();
    },
    'tooltips and popovers within button groups should have their container set to body': function (test) {
        test.expect(1);
        test.deepEqual(lintHtml(utf8Fixture('tooltips/in-btn-groups.html')),
            ["Tooltips and popovers within button groups should have their `container` set to `'body'`. Found tooltips/popovers that might lack this setting."],
            'should complain when `data-*`-based tooltips or popovers lack `data-container="body"`.');
        test.done();
    },
    'btn/input sizing used without input-group-* size': function (test) {
        test.expect(1);
        test.deepEqual(lintHtml(utf8Fixture('input-group/missing-input-group-sizing.html')),
            ["Button and input sizing within `.input-group`s can cause issues. Instead, use input group sizing classes `.input-group-lg` or `.input-group-sm`"],
            'should complain when an input/btn sizes are used within input-group.');
        test.done();
    },
    'input groups with multiple form controls': function (test) {
        test.expect(1);
        test.deepEqual(lintHtml(utf8Fixture('input-group/multiple-form-controls.html')),
            ["Input groups cannot contain multiple `.form-control`s"],
            'should complain when an input group contains multiple form controls.');
        test.done();
    },
    'mixing input groups with form groups': function (test) {
        test.expect(1);
        test.deepEqual(lintHtml(utf8Fixture('input-group/mixed-with-form-group.html')),
            ["`.input-group` and `.form-group` cannot be used directly on the same element. Instead, nest the `.input-group` within the `.form-group`"],
            'should complain when .input-group and .form-group are used on the same element.');
        test.done();
    },
    'mixing input groups with grid columns': function (test) {
        test.expect(1);
        test.deepEqual(lintHtml(utf8Fixture('input-group/mixed-with-grid-col.html')),
            ["`.input-group` and `.col-*-*` cannot be used directly on the same element. Instead, nest the `.input-group` within the `.col-*-*`"],
            'should complain when an input group has a grid column class on it.');
        test.done();
    },
    'input groups missing controls and addons': function (test) {
        test.expect(2);
        test.deepEqual(lintHtml(utf8Fixture('input-group/missing-input-group-addon.html')),
            ["`.input-group` must have a `.form-control` and either an `.input-group-addon` or an `.input-group-btn`."],
            'should complain when missing missing a `.form-control`');
        test.deepEqual(lintHtml(utf8Fixture('input-group/missing-form-control.html')),
            ["`.input-group` must have a `.form-control` and either an `.input-group-addon` or an `.input-group-btn`."],
            'should complain when missing missing a `.input-group-addon`');
        test.done();
    },
    'non-column children of rows': function (test) {
        test.expect(2);
        test.deepEqual(lintHtml(utf8Fixture('grid/non-col-row-children.html')),
            ["Only columns (`.col-*-*`) may be children of `.row`s"],
            'should complain when rows have non-column children.');
        test.deepEqual(lintHtml(utf8Fixture('grid/script-child-of-row.html')),
            [],
            'should not complain about <script> child of row');
        test.done();
    },
    'multiple columns on the same side of an input group': function (test) {
        test.expect(5);
        test.deepEqual(lintHtml(utf8Fixture('input-group/multiple-add-on-left.html')),
            ["Having multiple add-ons on a single side of an input group is not supported"],
            'should complain when multiple normal add-ons are on the left side of an input group.');
        test.deepEqual(lintHtml(utf8Fixture('input-group/multiple-add-on-right.html')),
            ["Having multiple add-ons on a single side of an input group is not supported"],
            'should complain when multiple normal add-ons are on the right side of an input group.');
        test.deepEqual(lintHtml(utf8Fixture('input-group/multiple-btn-add-on-left.html')),
            ["Having multiple add-ons on a single side of an input group is not supported"],
            'should complain when multiple button add-ons are on the left side of an input group.');
        test.deepEqual(lintHtml(utf8Fixture('input-group/multiple-btn-add-on-right.html')),
            ["Having multiple add-ons on a single side of an input group is not supported"],
            'should complain when multiple button add-ons are on the right side of an input group.');
        test.deepEqual(lintHtml(utf8Fixture('input-group/multiple-mixed-add-on-left.html')),
            ["Having multiple add-ons on a single side of an input group is not supported"],
            'should complain when both a normal add-on and a button add-on are on the left side of an input group.');
        test.done();
    },
    'dropdown-toggle comes before btn': function (test) {
        test.expect(2);
        test.deepEqual(lintHtml(utf8Fixture('buttons/btn-toggle.html')),
            [],
            'should not complain when correct .dropdown-toggle markup is used.');
        test.deepEqual(lintHtml(utf8Fixture('buttons/btn-toggle-after-btn.html')),
            ["`.btn.dropdown-toggle` must be the last button in a button group."],
            'should complain when `.dropdown-toggle` is on the left side of a btn');
        test.done();
    },
    'buttons should set type': function (test) {
        test.expect(2);
        test.deepEqual(lintHtml(utf8Fixture('buttons/without-type.html')),
            ['Found one or more `<button>`s missing a `type` attribute.'],
            'should complain about lack of type attribute on buttons');
        test.deepEqual(lintHtml(utf8Fixture('buttons/with-type.html')),
            [],
            'should not complain when type is set on buttons');
        test.done();
    },
    'use disabled attribute on button.btn and input.btn instead of .disabled': function (test) {
        test.expect(3);
        test.deepEqual(lintHtml(utf8Fixture('buttons/button-disabled-class.html')),
            ["Using the `.disabled` class on a `<button>` or `<input>` only changes the appearance of the element. It doesn't prevent the user from interacting with the element (for example, clicking on it or focusing it). If you want to truly disable the element, use the `disabled` attribute instead."],
            'should complain when Bootstrap v2 grid classes are present.');
        test.deepEqual(lintHtml(utf8Fixture('buttons/input-btn-disabled-class.html')),
            ["Using the `.disabled` class on a `<button>` or `<input>` only changes the appearance of the element. It doesn't prevent the user from interacting with the element (for example, clicking on it or focusing it). If you want to truly disable the element, use the `disabled` attribute instead."],
            'should complain when Bootstrap v2 grid classes are present.');
        test.deepEqual(lintHtml(utf8Fixture('buttons/disabled-attribute.html')),
            [],
            'should not complain when disabled attribute is set on buttons');
        test.done();
    },
    'inputs should set type': function (test) {
        test.expect(2);
        test.deepEqual(lintHtml(utf8Fixture('form-control/without-type.html')),
            ["Found one or more `<input>`s missing a `type` attribute."],
            'should complain about lack of type attribute on inputs');
        test.deepEqual(lintHtml(utf8Fixture('form-control/with-type.html')),
            [],
            'should not complain when type is set on inputs');
        test.done();
    },
    'incorrect markup for .checkbox, .radio, .checkbox-inline, and .radio-inline classes': function (test) {
        test.expect(7);

        test.deepEqual(lintHtml(utf8Fixture('checkboxes-radios/valid.html')),
            [],
            'should not complain when correct radio and checkbox markup is used.');

        test.deepEqual(lintHtml(utf8Fixture('checkboxes-radios/checkbox-block-bad.html')),
            ['Incorrect markup used with the `.checkbox` class. The correct markup structure is .checkbox>label>input[type="checkbox"]'],
            'should complain when invalid .checkbox markup is used.');
        test.deepEqual(lintHtml(utf8Fixture('checkboxes-radios/radio-block-bad.html')),
            ['Incorrect markup used with the `.radio` class. The correct markup structure is .radio>label>input[type="radio"]'],
            'should complain when invalid .radio markup is used.');

        test.deepEqual(lintHtml(utf8Fixture('checkboxes-radios/checkbox-inline-non-label.html')),
            ["`.checkbox-inline` should only be used on `<label>` elements"],
            'should complain when .checkbox-inline is used on a non-<label> element.');
        test.deepEqual(lintHtml(utf8Fixture('checkboxes-radios/radio-inline-non-label.html')),
            ["`.radio-inline` should only be used on `<label>` elements"],
            'should complain when .radio-inline is used on a non-<label> element.');

        test.deepEqual(lintHtml(utf8Fixture('checkboxes-radios/checkbox-inline-bad-structure.html')),
            ['Incorrect markup used with the `.checkbox-inline` class. The correct markup structure is label.checkbox-inline>input[type="checkbox"]'],
            'should complain when invalid .checkbox-inline markup is used.');
        test.deepEqual(lintHtml(utf8Fixture('checkboxes-radios/radio-inline-bad-structure.html')),
            ['Incorrect markup used with the `.radio-inline` class. The correct markup structure is label.radio-inline>input[type="radio"]'],
            'should complain when invalid .radio-inline markup is used.');

        test.done();
    },

    '.active class and checked attribute for buttons plugin do not match': function (test) {
        test.expect(3);
        test.deepEqual(lintHtml(utf8Fixture('buttons-plugin/valid.html')),
            [],
            'should not complain when .active and checked correspond correctly.');
        test.deepEqual(lintHtml(utf8Fixture('buttons-plugin/checkbox-bad.html')),
            ["`.active` class used without the `checked` attribute (or vice-versa) in a button group using the button.js plugin"],
            'should complain when .active and checked do not correspond correctly in a checkbox button group.');
        test.deepEqual(lintHtml(utf8Fixture('buttons-plugin/radio-bad.html')),
            ["`.active` class used without the `checked` attribute (or vice-versa) in a button group using the button.js plugin"],
            'should complain when .active and checked do not correspond correctly in a radio button group.');
        test.done();
    },
    'modals within other components': function (test) {
        test.expect(2);
        test.deepEqual(lintHtml(utf8Fixture('modal/within-table.html')),
            ["Modal markup should not be placed within other components, so as to avoid the component's styles interfering with the modal's appearance or functionality"],
            'should complain when a modal is placed within a `.table`.');
        test.deepEqual(lintHtml(utf8Fixture('modal/within-navbar.html')),
            ["Modal markup should not be placed within other components, so as to avoid the component's styles interfering with the modal's appearance or functionality"],
            'should complain when a modal is placed within a `.navbar`.');
        test.done();
    },

    'panel structure': function (test) {
        test.expect(5);
        test.deepEqual(lintHtml(utf8Fixture('panels/panels.html')),
            [],
            'should not complain when panel is structured correctly.');
        test.deepEqual(lintHtml(utf8Fixture('panels/panel-body-missing-parent.html')),
            ["`.panel-body` must have a `.panel` or `.panel-collapse` parent"],
            'should complain when .panel-body is missing .panel or .panel-collapse parent');
        test.deepEqual(lintHtml(utf8Fixture('panels/panel-footer-missing-parent.html')),
            ["`.panel-footer` must have a `.panel` or `.panel-collapse` parent"],
            'should complain when .panel-footer is missing .panel parent');
        test.deepEqual(lintHtml(utf8Fixture('panels/panel-title-missing-parent.html')),
            ["`.panel-title` must have a `.panel-heading` parent"],
            'should complain when .panel-title is missing .panel-heading parent');
        test.deepEqual(lintHtml(utf8Fixture('panels/panel-heading-missing-parent.html')),
            ["`.panel-heading` must have a `.panel` parent"],
            'should complain when .panel-heading is missing .panel parent');
        test.done();
    },

    'columns outside of rows and form groups': function (test) {
        test.expect(3);
        test.deepEqual(lintHtml(utf8Fixture('grid/cols-within-row.html')),
            [],
            'should not complain when columns are within a row.'
        );
        test.deepEqual(lintHtml(utf8Fixture('grid/cols-within-form-group.html')),
            [],
            'should not complain when columns are within a form group.'
        );
        test.deepEqual(lintHtml(utf8Fixture('grid/cols-outside-row-and-form-group.html')),
            ["Columns (`.col-*-*`) can only be children of `.row`s or `.form-group`s"],
            'should complain when columns are outside of rows and form groups.'
        );
        test.done();
    },

    '.table-responsive on the table itself': function (test) {
        test.expect(2);
        test.deepEqual(lintHtml(utf8Fixture('table/responsive-valid.html')),
            [],
            'should not complain when .table-responsive is used on the table\'s wrapper div.'
        );
        test.deepEqual(lintHtml(utf8Fixture('table/responsive-incorrect.html')),
            ["`.table-responsive` is supposed to be used on the table's parent wrapper `<div>`, not on the table itself"],
            'should complain when .table-responsive is used on the table itself.'
        );
        test.done();
    },

    'redundant grid column classes': function (test) {
        test.expect(2);
        test.deepEqual(lintHtml(utf8Fixture('grid/cols-not-redundant.html')),
            [],
            'should not complain when there are non-redundant grid column classes.'
        );
        test.deepEqual(lintHtml(utf8Fixture('grid/cols-redundant.html')),
            [
                'Since grid classes apply to devices with screen widths greater than or equal to the breakpoint sizes (unless overridden by grid classes targeting larger screens), `class="abc col-xs-2 def col-sm-1 ghi col-md-1 jkl col-lg-1"` is redundant and can be simplified to `class="abc def ghi jkl col-xs-2 col-sm-1"`',
                'Since grid classes apply to devices with screen widths greater than or equal to the breakpoint sizes (unless overridden by grid classes targeting larger screens), `class="col-xs-10 abc col-sm-10 def col-md-10 ghi col-lg-12 jkl"` is redundant and can be simplified to `class="abc def ghi jkl col-xs-10 col-lg-12"`',
                'Since grid classes apply to devices with screen widths greater than or equal to the breakpoint sizes (unless overridden by grid classes targeting larger screens), `class="col-xs-6 col-sm-6 col-md-6 col-lg-6"` is redundant and can be simplified to `class="col-xs-6"`',
                'Since grid classes apply to devices with screen widths greater than or equal to the breakpoint sizes (unless overridden by grid classes targeting larger screens), `class="col-xs-5 col-sm-5"` is redundant and can be simplified to `class="col-xs-5"`',
                'Since grid classes apply to devices with screen widths greater than or equal to the breakpoint sizes (unless overridden by grid classes targeting larger screens), `class="col-sm-4 col-md-4"` is redundant and can be simplified to `class="col-sm-4"`',
                'Since grid classes apply to devices with screen widths greater than or equal to the breakpoint sizes (unless overridden by grid classes targeting larger screens), `class="col-md-3 col-lg-3"` is redundant and can be simplified to `class="col-md-3"`'
            ],
            'should complain when there are redundant grid column classes.'
        );
        test.done();
    },

    'empty spacer grid columns': function (test) {
        test.expect(10);
        test.deepEqual(lintHtml(utf8Fixture('grid/spacer-col/blank-text.html')),
            ['Using empty spacer columns isn\'t necessary with Bootstrap\'s grid. So instead of having an empty grid column with `class="col-xs-11"` , just add `class="col-xs-offset-11"` to the next grid column.'],
            'should complain when spacer column contains only whitespace text content.'
        );
        test.deepEqual(lintHtml(utf8Fixture('grid/spacer-col/non-blank-text.html')),
            [],
            'should not complain when spacer-like column contains non-whitespace-only text content.'
        );
        test.deepEqual(lintHtml(utf8Fixture('grid/spacer-col/child-with-text.html')),
            [],
            'should not complain when spacer-like column contains child with text content.'
        );
        test.deepEqual(lintHtml(utf8Fixture('grid/spacer-col/child-without-text.html')),
            [],
            'should not complain when spacer-like column contains child element without text content.'
        );
        test.deepEqual(lintHtml(utf8Fixture('grid/spacer-col/no-child-no-text.html')),
            ['Using empty spacer columns isn\'t necessary with Bootstrap\'s grid. So instead of having an empty grid column with `class="col-xs-11"` , just add `class="col-xs-offset-11"` to the next grid column.'],
            'should complain when spacer column is completely empty.'
        );
        test.deepEqual(lintHtml(utf8Fixture('grid/spacer-col/col-element.html')),
            [],
            'should not complain about <col> elements with grid column classes.'
        );
        test.deepEqual(lintHtml(utf8Fixture('grid/spacer-col/last-child.html')),
            [],
            'should not complain when the spacer column is the last column in the row.'
        );
        test.deepEqual(lintHtml(utf8Fixture('grid/spacer-col/tricky-classes.html')),
            ['Using empty spacer columns isn\'t necessary with Bootstrap\'s grid. So instead of having an empty grid column with `class="col-xs-11"` , just add `class="col-xs-offset-11"` to the next grid column.'],
            'should process classes named similar to grid column classes correctly.'
        );
        test.deepEqual(lintHtml(utf8Fixture('grid/spacer-col/multiple-reversed-order.html')),
            ['Using empty spacer columns isn\'t necessary with Bootstrap\'s grid. So instead of having an empty grid column with `class="col-xs-11 col-sm-8 col-md-6 col-lg-5"` , just add `class="col-xs-offset-11 col-sm-offset-8 col-md-offset-6 col-lg-offset-5"` to the next grid column.'],
            'should sort the grid classes in its message and handle multiple grid classes correctly.'
        );
        test.deepEqual(lintHtml(utf8Fixture('grid/spacer-col/void-elements.html')),
            [],
            'should ignore void elements.'
        );
        test.done();
    },

    '.form-control-feedback without a .has-feedback ancestor': function (test) {
        test.expect(3);
        test.deepEqual(lintHtml(utf8Fixture('feedback/form-control-valid.html')),
            [],
            'should not complain when .form-control-feedback has a correct ancestor.'
        );
        test.deepEqual(lintHtml(utf8Fixture('feedback/form-control-bad.html')),
            ["`.form-control-feedback` must have a `.form-group.has-feedback` ancestor"],
            'should complain when .form-control-feedback doesn\'t have a .form-group.has-feedback ancestor.'
        );
        test.deepEqual(lintHtml(utf8Fixture('feedback/nested-form-control-bad.html')),
            ["`.form-control-feedback` must have a `.form-group.has-feedback` ancestor"],
            'should complain when a nested .form-control-feedback doesn\'t have a .form-group.has-feedback ancestor.'
        );
        test.done();
    },

    'Glyphicons on non-empty elements': function (test) {
        test.expect(3);
        test.deepEqual(lintHtml(utf8Fixture('glyphicons/valid.html')),
            [],
            'should not complain when the .glyphicon element has no text content or children.'
        );
        test.deepEqual(lintHtml(utf8Fixture('glyphicons/on-elem-with-text.html')),
            ["Glyphicon classes must only be used on elements that contain no text content and have no child elements."],
            'should complain when Glyphicon is used on an element with text content.'
        );
        test.deepEqual(lintHtml(utf8Fixture('glyphicons/on-elem-with-child.html')),
            ["Glyphicon classes must only be used on elements that contain no text content and have no child elements."],
            'should complain when Glyphicon is used on an element with child element(s).'
        );
        test.done();
    },

    'Glyphicons missing the .glyphicon class': function (test) {
        test.expect(2);
        test.deepEqual(lintHtml(utf8Fixture('glyphicons/valid.html')),
            [],
            'should not complain when Glyphicon is used correctly.'
        );
        test.deepEqual(lintHtml(utf8Fixture('glyphicons/missing-glyphicon-class.html')),
            ["Found elements with a `.glyphicon-*` class that were missing the additional required `.glyphicon` class."],
            'should complain when .glyphicon-* class is used without the .glyphicon class.'
        );
        test.done();
    },

    'modal structure': function (test) {
        test.expect(7);
        test.deepEqual(lintHtml(utf8Fixture('modal/valid.html')),
            [],
            'should not complain when modal markup structure is correct.'
        );
        test.deepEqual(lintHtml(utf8Fixture('modal/dialog-outside-modal.html')),
            ["`.modal-dialog` must be a child of `.modal`"],
            'should complain when modal dialog not within modal.'
        );
        test.deepEqual(lintHtml(utf8Fixture('modal/content-outside-dialog.html')),
            ["`.modal-content` must be a child of `.modal-dialog`"],
            'should complain when modal content not within modal dialog.'
        );
        test.deepEqual(lintHtml(utf8Fixture('modal/header-outside-content.html')),
            ["`.modal-header` must be a child of `.modal-content`"],
            'should complain when modal header not within modal content'
        );
        test.deepEqual(lintHtml(utf8Fixture('modal/body-outside-content.html')),
            ["`.modal-body` must be a child of `.modal-content`"],
            'should complain when modal body not within modal content.'
        );
        test.deepEqual(lintHtml(utf8Fixture('modal/footer-outside-content.html')),
            ["`.modal-footer` must be a child of `.modal-content`"],
            'should complain when modal footer not within modal content.'
        );
        test.deepEqual(lintHtml(utf8Fixture('modal/title-outside-header.html')),
            ["`.modal-title` must be a child of `.modal-header`"],
            'should complain when modal title is not within modal header.'
        );
        test.done();
    },

    'form classes used directly on form groups': function (test) {
        test.expect(2);
        test.deepEqual(lintHtml(utf8Fixture('form/form-inline-group.html')),
            ["Neither `.form-inline` nor `.form-horizontal` should be used directly on a `.form-group`. Instead, nest the `.form-group` within the `.form-inline` or `.form-horizontal`"],
            'should complain about form-group having .form-inline'
        );
        test.deepEqual(lintHtml(utf8Fixture('form/form-horizontal-group.html')),
            ["Neither `.form-inline` nor `.form-horizontal` should be used directly on a `.form-group`. Instead, nest the `.form-group` within the `.form-inline` or `.form-horizontal`"],
            'should complain about form-group having .form-horizontal'
        );
        test.done();
    },

    'incorrect alerts with dismiss/close buttons': function (test) {
        test.expect(5);
        test.deepEqual(lintHtml(utf8Fixture('alert-dismiss-close/valid.html')),
            [],
            'should not complain when dismissible alert markup structure is correct.'
        );
        test.deepEqual(lintHtml(utf8Fixture('alert-dismiss-close/close-preceded-by-nothing.html')),
            [],
            'should not complain when close button is preceded by nothing.'
        );
        test.deepEqual(lintHtml(utf8Fixture('alert-dismiss-close/missing-alert-dismissible.html')),
            ['`.alert` with dismiss button must have class `.alert-dismissible`'],
            'should complain when alert with dismiss button is missing .alert-dismissible class.'
        );
        test.deepEqual(lintHtml(utf8Fixture('alert-dismiss-close/close-preceded-by-text.html')),
            ['`.close` button for `.alert` must be the first element in the `.alert`'],
            'should complain when alert close button is not first child in alert.'
        );
        test.deepEqual(lintHtml(utf8Fixture('alert-dismiss-close/close-preceded-by-elem.html')),
            ['`.close` button for `.alert` must be the first element in the `.alert`'],
            'should complain when alert close button is not first child in alert.'
        );
        test.done();
    },

    'pull classes inside media': function (test) {
        test.expect(2);
        test.deepEqual(lintHtml(utf8Fixture('media/deprecated-pull-classes.html')),
            ['Using `.pull-left` or `.pull-right` as part of the media object component is deprecated as of Bootstrap v3.3.0. Use `.media-left` or `.media-right` instead.'],
            'should complain about .pull-* classes in .media'
        );
        test.deepEqual(lintHtml(utf8Fixture('media/media-classes.html')),
            [],
            'should not complain about .media-left or .media-right classes.'
        );
        test.done();
    },

    'invalid nonexistent .col-*-0 classes': function (test) {
        test.expect(4);
        test.deepEqual(lintHtml(utf8Fixture('grid/col-xs-0.html')),
            [
                'Only columns (`.col-*-*`) may be children of `.row`s',
                'Column widths must be positive integers (and <= 12 by default). Found usage(s) of invalid nonexistent `.col-*-0` classes.'
            ],
            'should complain about usage of .col-*-0 class.'
        );
        test.deepEqual(lintHtml(utf8Fixture('grid/col-sm-0.html')),
            [
                'Only columns (`.col-*-*`) may be children of `.row`s',
                'Column widths must be positive integers (and <= 12 by default). Found usage(s) of invalid nonexistent `.col-*-0` classes.'
            ],
            'should complain about usage of .col-*-0 class.'
        );
        test.deepEqual(lintHtml(utf8Fixture('grid/col-md-0.html')),
            [
                'Only columns (`.col-*-*`) may be children of `.row`s',
                'Column widths must be positive integers (and <= 12 by default). Found usage(s) of invalid nonexistent `.col-*-0` classes.'
            ],
            'should complain about usage of .col-*-0 class.'
        );
        test.deepEqual(lintHtml(utf8Fixture('grid/col-lg-0.html')),
            [
                'Only columns (`.col-*-*`) may be children of `.row`s',
                'Column widths must be positive integers (and <= 12 by default). Found usage(s) of invalid nonexistent `.col-*-0` classes.'
            ],
            'should complain about usage of .col-lg-0 class.'
        );
        test.done();
    },

    'outdated version of Bootstrap': function (test) {
        test.expect(5);
        test.deepEqual(lintHtml(utf8Fixture('outdated/bootstrap-css.html')),
            ['Bootstrap version might be outdated. Latest version is at least 3.3.6 ; saw what appears to be usage of Bootstrap 3.2.0'],
            'should complain about outdated bootstrap.css.');
        test.deepEqual(lintHtml(utf8Fixture('outdated/bootstrap-min-css.html')),
            ['Bootstrap version might be outdated. Latest version is at least 3.3.6 ; saw what appears to be usage of Bootstrap 3.2.0'],
            'should complain about outdated bootstrap.min.css.');
        test.deepEqual(lintHtml(utf8Fixture('outdated/bootstrap-js.html')),
            ['Bootstrap version might be outdated. Latest version is at least 3.3.6 ; saw what appears to be usage of Bootstrap 3.2.0'],
            'should complain about outdated bootstrap.js.');
        test.deepEqual(lintHtml(utf8Fixture('outdated/bootstrap-min-js.html')),
            ['Bootstrap version might be outdated. Latest version is at least 3.3.6 ; saw what appears to be usage of Bootstrap 3.2.0'],
            'should complain about outdated bootstrap.min.js.');
        test.deepEqual(lintHtml(utf8Fixture('outdated/bootstrap-extensions-okay.html')),
            [],
            'should not complain about outdated libraries that just have "bootstrap" in their name.');
        test.done();
    },

    'version 4 of Bootstrap': function (test) {
        test.expect(5);
        test.deepEqual(lintHtml(utf8Fixture('version-4/bootstrap-css.html')),
            ['Detected what appears to be Bootstrap v4 or later. This version of Bootlint only supports Bootstrap v3.'],
            'should complain about version 4 of bootstrap.css.');
        test.deepEqual(lintHtml(utf8Fixture('version-4/bootstrap-min-css.html')),
            ['Detected what appears to be Bootstrap v4 or later. This version of Bootlint only supports Bootstrap v3.'],
            'should complain about version 4 of bootstrap.min.css.');
        test.deepEqual(lintHtml(utf8Fixture('version-4/bootstrap-js.html')),
            ['Detected what appears to be Bootstrap v4 or later. This version of Bootlint only supports Bootstrap v3.'],
            'should complain about version 4 of bootstrap.js.');
        test.deepEqual(lintHtml(utf8Fixture('version-4/bootstrap-min-js.html')),
            ['Detected what appears to be Bootstrap v4 or later. This version of Bootlint only supports Bootstrap v3.'],
            'should complain about version 4 of bootstrap.min.js.');
        test.deepEqual(lintHtml(utf8Fixture('version-4/bootstrap-extensions-okay.html')),
            [],
            'should not complain about v4.0.0+ libraries that just have "bootstrap" in their name.');
        test.done();
    },

    'carousel control target': function (test) {
        test.expect(3);
        test.deepEqual(lintHtml(utf8Fixture('carousel/indicators.html')),
            [
                'Carousel controls and indicators should use `href` or `data-target` to reference an element with class `.carousel`.'
            ],
            'should complain about incorrect indicator control targets.'
        );
        test.deepEqual(lintHtml(utf8Fixture('carousel/controls.html')),
            [
                'Carousel controls and indicators should use `href` or `data-target` to reference an element with class `.carousel`.'
            ],
            'should complain about incorrect indicator control targets.'
        );
        test.deepEqual(lintHtml(utf8Fixture('carousel/valid.html')),
            [],
            'should not complain about correct indicator control targets.'
        );
        test.done();
    },

    'media pulls outside of media objects': function (test) {
        test.expect(4);
        test.deepEqual(lintHtml(utf8Fixture('media/media-classes.html')),
            [],
            'should not complain about media pulls inside media objects.'
        );
        test.deepEqual(lintHtml(utf8Fixture('media/misplaced-media-left.html')),
            ['`.media-left` and `.media-right` should not be used outside of `.media` objects.'],
            'should complain about .media-left outside of a media object.'
        );
        test.deepEqual(lintHtml(utf8Fixture('media/misplaced-media-right.html')),
            ['`.media-left` and `.media-right` should not be used outside of `.media` objects.'],
            'should complain about .media-right outside of a media object.'
        );
        test.deepEqual(lintHtml(utf8Fixture('media/media-pull-on-media.html')),
            ['`.media-left` and `.media-right` should not be used outside of `.media` objects.'],
            'should complain about media pulls on .media itself.'
        );
        test.done();
    },

    'navbar pulls outside of navbars': function (test) {
        test.expect(4);
        test.deepEqual(lintHtml(utf8Fixture('navbar/navbar-left-bad.html')),
            ['`.navbar-left` and `.navbar-right` should not be used outside of navbars.'],
            'should complain about .navbar-left outside of .navbar.'
        );
        test.deepEqual(lintHtml(utf8Fixture('navbar/navbar-right-bad.html')),
            ['`.navbar-left` and `.navbar-right` should not be used outside of navbars.'],
            'should complain about .navbar-right outside of .navbar.'
        );
        test.deepEqual(lintHtml(utf8Fixture('navbar/navbar-left-right-on-navbar.html')),
            ['`.navbar-left` and `.navbar-right` should not be used outside of navbars.'],
            'should complain about .navbar-left/right directly on a .navbar.'
        );
        test.deepEqual(lintHtml(utf8Fixture('navbar/navbar-left-right-valid.html')),
            [],
            'should not complain about .navbar-left or .navbar-right inside of .navbar.'
        );
        test.done();
    },

    'modal with .hide class': function (test) {
        test.expect(2);
        test.deepEqual(lintHtml(utf8Fixture('modal/with-hide.html')),
            ['`.hide` should not be used on `.modal` in Bootstrap v3.'],
            'should complain about a modal with the .hide class.'
        );
        test.deepEqual(lintHtml(utf8Fixture('modal/valid.html')),
            [],
            'should not complain about a modal without the .hide class.'
        );
        test.done();
    },

    'carousel structure': function (test) {
        test.expect(5);
        test.deepEqual(lintHtml(utf8Fixture('carousel/valid.html')),
            [],
            'should not complain about correctly structured carousels.'
        );
        test.deepEqual(lintHtml(utf8Fixture('carousel/missing-inner.html')),
            ['`.carousel` must have exactly one `.carousel-inner` child.'],
            'should complain about a carousel without a .carousel-inner.'
        );
        test.deepEqual(lintHtml(utf8Fixture('carousel/multiple-inner.html')),
            ['`.carousel` must have exactly one `.carousel-inner` child.'],
            'should complain about a carousel with multiple .carousel-inner children.'
        );
        test.deepEqual(lintHtml(utf8Fixture('carousel/missing-active-item.html')),
            ['`.carousel-inner` must have exactly one `.item.active` child.'],
            'should complain about a carousel without an active item.'
        );
        test.deepEqual(lintHtml(utf8Fixture('carousel/multiple-active-item.html')),
            ['`.carousel-inner` must have exactly one `.item.active` child.'],
            'should complain about a carousel with multiple active items.'
        );
        test.done();
    },

    'container inside navbar': function (test) {
        test.expect(1);
        test.deepEqual(lintHtml(utf8Fixture('navbar/navbar-container.html')),
            ["`.navbar`'s first child element should always be either `.container` or `.container-fluid`"],
            'should complain about no .container/.container-fluid inside .navbar.'
        );
        test.done();
    },

    '.form-control on wrong element or input type': function (test) {
        test.expect(11);
        test.deepEqual(lintHtml(utf8Fixture('form-control/span-invalid.html')),
            ['`.form-control` should only be used on `<input>`s, `<textarea>`s, and `<select>`s.'],
            'should complain about .form-control on <span>.'
        );
        test.deepEqual(lintHtml(utf8Fixture('form-control/type-button.html')),
            ['`.form-control` cannot be used on non-textual `<input>`s, such as those whose `type` is: `file`, `checkbox`, `radio`, `range`, `button`'],
            'should complain about .form-control on <input type="button">.'
        );
        test.deepEqual(lintHtml(utf8Fixture('form-control/type-checkbox.html')),
            ['`.form-control` cannot be used on non-textual `<input>`s, such as those whose `type` is: `file`, `checkbox`, `radio`, `range`, `button`'],
            'should complain about .form-control on <input type="checkbox">.'
        );
        test.deepEqual(lintHtml(utf8Fixture('form-control/type-file.html')),
            ['`.form-control` cannot be used on non-textual `<input>`s, such as those whose `type` is: `file`, `checkbox`, `radio`, `range`, `button`'],
            'should complain about .form-control on <input type="file">.'
        );
        test.deepEqual(lintHtml(utf8Fixture('form-control/type-hidden.html')),
            ['`.form-control` cannot be used on non-textual `<input>`s, such as those whose `type` is: `file`, `checkbox`, `radio`, `range`, `button`'],
            'should complain about .form-control on <input type="hidden">.'
        );
        test.deepEqual(lintHtml(utf8Fixture('form-control/type-image.html')),
            ['`.form-control` cannot be used on non-textual `<input>`s, such as those whose `type` is: `file`, `checkbox`, `radio`, `range`, `button`'],
            'should complain about .form-control on <input type="image">.'
        );
        test.deepEqual(lintHtml(utf8Fixture('form-control/type-radio.html')),
            ['`.form-control` cannot be used on non-textual `<input>`s, such as those whose `type` is: `file`, `checkbox`, `radio`, `range`, `button`'],
            'should complain about .form-control on <input type="radio">.'
        );
        test.deepEqual(lintHtml(utf8Fixture('form-control/type-range.html')),
            ['`.form-control` cannot be used on non-textual `<input>`s, such as those whose `type` is: `file`, `checkbox`, `radio`, `range`, `button`'],
            'should complain about .form-control on <input type="range">.'
        );
        test.deepEqual(lintHtml(utf8Fixture('form-control/type-reset.html')),
            ['`.form-control` cannot be used on non-textual `<input>`s, such as those whose `type` is: `file`, `checkbox`, `radio`, `range`, `button`'],
            'should complain about .form-control on <input type="reset">.'
        );
        test.deepEqual(lintHtml(utf8Fixture('form-control/type-submit.html')),
            ['`.form-control` cannot be used on non-textual `<input>`s, such as those whose `type` is: `file`, `checkbox`, `radio`, `range`, `button`'],
            'should complain about .form-control on <input type="submit">.'
        );
        test.deepEqual(lintHtml(utf8Fixture('form-control/valid.html')),
            [],
            'should not complain about usage of .form-control on valid elements and input types.'
        );
        test.done();
    },

    '.img-responsive not on image': function (test) {
        test.expect(2);
        test.deepEqual(lintHtml(utf8Fixture('images/img-responsive-bad.html')),
            ['`.img-responsive` should only be used on `<img>`s'],
            'should complain about .img-responsive not on an image.'
        );
        test.deepEqual(lintHtml(utf8Fixture('images/img-responsive-valid.html')),
            [],
            'should not complain about .img-responsive on an image.'
        );
        test.done();
    },
    'btn classes on anchors within .navbar-nav': function (test) {
        test.expect(2);
        test.deepEqual(lintHtml(utf8Fixture('navbar/btn-bad.html')),
            ['Button classes (`.btn`, `.btn-*`, `.navbar-btn`) cannot be used on `<a>`s within `.navbar-nav`s.'],
            'should complain about a .btn within the .navbar-nav class.'
        );
        test.deepEqual(lintHtml(utf8Fixture('navbar/navbar-btn-bad.html')),
            ['Button classes (`.btn`, `.btn-*`, `.navbar-btn`) cannot be used on `<a>`s within `.navbar-nav`s.'],
            'should complain about a .navbar-btn within the .navbar-nav class.'
        );
        test.done();
    },
    'modal missing tabindex': function (test) {
        test.expect(1);
        test.deepEqual(lintHtml(utf8Fixture('modal/tabindex-missing.html')),
            ['`.modal` elements must have a `tabindex` attribute.'],
            'should complain about modal missing a `tabindex` attribute.'
        );
        test.done();
    },
    '.btn not on <a>/<button>/<input>/<label>': function (test) {
        test.expect(2);
        test.deepEqual(lintHtml(utf8Fixture('buttons/btn-incorrect-element.html')),
            ['`.btn` should only be used on `<a>`, `<button>`, `<input>`, or `<label>` elements.'],
            'should complain about .btn on a non-<a>/<button>/<input>/<label>.'
        );
        test.deepEqual(lintHtml(utf8Fixture('buttons/btn-correct-element.html')),
            [],
            'should not complain about `.btn` on an <a>, <button>, <input>, or <label>.'
        );
        test.done();
    },
    'modal missing role dialog': function (test) {
        test.expect(1);
        test.deepEqual(lintHtml(utf8Fixture('modal/missing-role-dialog.html')),
            ['`.modal` must have a `role="dialog"` attribute.'],
            'should complain about modal missing a `role` attribute.'
        );
        test.done();
    },
    'modal-dialog missing role document': function (test) {
        test.expect(1);
        test.deepEqual(lintHtml(utf8Fixture('modal/missing-role-document.html')),
            ['`.modal-dialog` must have a `role="document"` attribute.'],
            'should complain about modal-dialog missing a `role` attribute.'
        );
        test.done();
    }
};
