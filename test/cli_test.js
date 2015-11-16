/*eslint-env node */
/*eslint no-process-env: 0 */

'use strict';

var sinon = require('sinon');
var rewire = require('rewire');
var cli = (process.env.BOOTLINT_COV === '1') ? rewire('../src-cov/cli.js') : rewire('../src/cli.js');

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
var startingDir = process.cwd();
var oldTTY = null;

function rAfter() {
    if (process.stdout.write.restore) {
        process.stdout.write.restore();
    }

    if (process.stderr.write.restore) {
        process.stderr.write.restore();
    }
}

exports.bootlint = {
    setUp: function (done) {
        oldTTY = process.stdin.isTTY;

        sinon.stub(process.stdout, 'write');
        sinon.stub(process.stderr, 'write');
        done();
    },
    tearDown: function (done) {
        process.stdin.isTTY = oldTTY;
        process.chdir(startingDir);

        // If stdin rewrites were not used, restore them here
        rAfter();
        done();
    },
    'Disable tags': function (test) {
        var i = 0;

        sinon.stub(console, 'log', function (message) {
            switch (i) {
                case 0: {
                    test.strictEqual(message, '');
                    break;
                }
                case 1: {
                    test.strictEqual(message, '0 lint error(s) found across 0 file(s).');
                    break;
                }
            }

            i++;
        });

        cli.__set__('process', {
            argv: [''],
            stdin: {
                isTTY: process.stdin.isTTY
            }
        });

        cli();

        test.done();
    }
};
