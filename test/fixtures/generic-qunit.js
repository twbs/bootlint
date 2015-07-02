/* global QUnit, expect, bootlint */
/* jshint browser: true */
/*eslint-env browser */

(function () {
    'use strict';

    function lintCurrentDoc(disabledIds) {
        var lints = [];
        var reporter = function (lint) {
            lints.push(lint.message);
        };
        bootlint.lintCurrentDocument(reporter, disabledIds);
        return lints;
    }

    QUnit.test(window.location.pathname, function (assert) {
        expect(1);
        var lints = Array.prototype.slice.call(document.querySelectorAll('#bootlint>li'));
        var expectedLintMsgs = lints.filter(function (item) {
            return typeof item.dataset.lint === 'string';
        }).map(function (item) {
            return item.dataset.lint;
        });
        var disabledIds = lints.filter(function (item) {
            return typeof item.dataset.disabled === 'string';
        }).map(function (item) {
            return item.dataset.disabled;
        });
        var actualLintMsgs = lintCurrentDoc(disabledIds);
        assert.deepEqual(actualLintMsgs, expectedLintMsgs);
    });
})();
