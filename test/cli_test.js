/*eslint-env node */
/*eslint no-process-env: 0 */

'use strict';

var cli = (process.env.BOOTLINT_COV === '1') ? require('../src-cov/cli.js') : require('../src/cli.js');

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
    'Program details': function (test) {
        test.expect(3);
        test.strictEqual(cli.program.version(), '0.11.0', 'should give the current Bootlint version.');
        test.strictEqual(cli.program.description(), 'Lint the HTML of Bootstrap projects', 'should provide a description of Bootlint.');
        test.strictEqual(cli.program.usage(), '[options] [files...]', 'should tell how to use Bootlint.');
        test.done();
    },
    'Disabled options': function (test) {
        test.expect(5);
        test.strictEqual(cli.program.option('')._allowUnknownOption, false, 'Don\'t allow unknown command line options.');
        test.strictEqual(cli.program.option('')._name, 'grunt', 'should list the program\'s name.');
        test.strictEqual(cli.program.option('')._version, '0.11.0', 'should list the program\'s version.');
        test.strictEqual(cli.program.option('')._description, 'Lint the HTML of Bootstrap projects',
            'should provide a description of Bootlint.');
        test.strictEqual(cli.program.option('')._usage, '[options] [files...]', 'should provide Bootlint usage options.');
        test.done();
    },
    'Version flag': function (test) {
        test.expect(7);
        test.strictEqual(cli.program.option('').options[0].flags, '-V, --version', 'should list the version flag');
        test.strictEqual(cli.program.option('').options[0].required, 0, 'should not require the version flag.');
        test.strictEqual(cli.program.option('').options[0].optional, 0, 'should return whether the version flag is optional.');
        test.strictEqual(cli.program.option('').options[0].bool, true, 'should return whether the version flag is optional.');
        test.strictEqual(cli.program.option('').options[0].short, '-V', 'should list the short version flag');
        test.strictEqual(cli.program.option('').options[0].long, '--version', 'should list the long version flag');
        test.strictEqual(cli.program.option('').options[0].description, 'output the version number',
            'should provide a description of the version flag');
        test.done();
    },
    'Disabled flag': function (test) {
        test.expect(7);
        test.strictEqual(cli.program.option('').options[1].flags, '-d, --disable <IDs>', 'should list the disable flag');
        test.strictEqual(cli.program.option('').options[1].required, -15, 'should not require the disabled flag.');
        test.strictEqual(cli.program.option('').options[1].optional, 0, 'should return whether the version flag is optional.');
        test.strictEqual(cli.program.option('').options[1].bool, true, 'should return whether the version flag is optional.');
        test.strictEqual(cli.program.option('').options[1].short, '-d', 'should list the short disable flag');
        test.strictEqual(cli.program.option('').options[1].long, '--disable', 'should list the long disable flag');
        test.strictEqual(cli.program.option('').options[1].description, 'Comma-separated list of disabled lint problem IDs',
            'should provide a description of the disable flag');
        test.done();
    },
    'Handle standard input': function (test) {
        test.expect(6);
        test.strictEqual(cli.handleStdin('-d')._bitField, 268435456, 'Should calculate bitfield of argument');
        test.strictEqual(cli.handleStdin('-d')._fulfillmentHandler0, undefined, 'Should leave fulfillment handler as undefined.');
        test.strictEqual(cli.handleStdin('-d')._rejectionHandler0, undefined, 'Should leave rejection handler as undefined');
        test.strictEqual(cli.handleStdin('-d')._promise0, undefined, 'Should leave promise undefined.');
        test.strictEqual(cli.handleStdin('-d')._receiver0, undefined, 'Should leave receiver as undefined');
        test.strictEqual(cli.handleStdin('-d')._settledValue, undefined, 'Should leave settled value as undefined.');
        test.done();
    },
    'Build reporter': function (test) {
        test.expect(1);
        var reporter = cli.buildReporter('<stdin>');
        test.strictEqual(typeof reporter, 'function', 'Reporter should be a function');
        test.done();
    }
};
