/* eslint-env node */

'use strict';

var os = require('os');
var glob = require('glob');
var async = require('async');
var qunit = require('node-qunit-phantomjs');

var THREADS = os.cpus().length <= 2 ? 1 : os.cpus().length / 2;

var ignores = [
    'test/fixtures/jquery/missing.html',
    'test/fixtures/jquery/and_bs_js_both_missing.html',
    'test/fixtures/charset/not-utf8.html'
];

glob('test/fixtures/**/*.html', {ignore: ignores}, function (err, files) {
    if (err) {
        throw err;
    }

    async.eachLimit(files,
        THREADS,
        function (file, callback) {
            qunit(file, {timeout: 10}, callback);
        }, function (er) {
            if (er) {
                throw er;
            }
        });
});
