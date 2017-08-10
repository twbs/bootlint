/* eslint-env browser, jquery, qunit */
/* global bootlint */

(function () {
    'use strict';

    function lintCurrentDoc() {
        var lints = [];
        var reporter = function (lint) {
            lints.push(lint.message);
        };
        bootlint.lintCurrentDocument(reporter, []);
        return lints;
    }

    QUnit.test(window.location.pathname, function (assert) {
        // Remove checkboxes QUnit dynamically adds to the DOM as part of its UI
        // because these checkboxes may not comply with some Bootlint checks.
        $('#qunit-filter-pass, #qunit-urlconfig-noglobals, #qunit-urlconfig-notrycatch').remove();

        expect(1);
        var lints = Array.prototype.slice.call(document.querySelectorAll('#bootlint>li'));
        var expectedLintMsgs = lints.map(function (item) {
            return item.dataset.lint;
        });
        var actualLintMsgs = lintCurrentDoc();
        assert.deepEqual(actualLintMsgs, expectedLintMsgs);
    });
})();
