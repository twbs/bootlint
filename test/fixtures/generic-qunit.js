/* global QUnit, expect, bootlint */
/* jshint browser: true */
/*eslint-env browser */

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
        expect(1);
        var lints = Array.prototype.slice.call(document.querySelectorAll('#bootlint>li'));
        var expectedLintMsgs = lints.map(function (item) {
            return item.dataset.lint;
        });
        var actualLintMsgs = lintCurrentDoc();
        assert.deepEqual(actualLintMsgs, expectedLintMsgs);
    });
})();
