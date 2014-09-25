/* global QUnit, expect, bootlint */
/*eslint-env browser */

QUnit.test(window.location.pathname, function (assert) {
    'use strict';

    expect(1);
    var lints = Array.prototype.slice.call(document.querySelectorAll('#bootlint>li'));
    var expectedLintMsgs = lints.map(function (item) {
        return item.dataset.lint;
    });
    var actualLintMsgs = bootlint.lintCurrentDocument();
    assert.deepEqual(actualLintMsgs, expectedLintMsgs);
});
