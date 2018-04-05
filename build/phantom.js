/* eslint-env node, es6 */

'use strict';

const os = require('os');
const glob = require('glob');
const async = require('async');
const isTravis = require('is-travis');
const qunit = require('node-qunit-phantomjs');

const cpus = os.cpus().length;
let THREADS;

if (isTravis) {
    THREADS = cpus;
} else if (cpus <= 2) {
    THREADS = 1;
} else {
    THREADS = cpus / 2;
}

const ignore = [
    'test/fixtures/jquery/missing.html',
    'test/fixtures/jquery/and_bs_js_both_missing.html',
    'test/fixtures/charset/not-utf8.html'
];

glob('test/fixtures/**/*.html', {ignore}, (err, files) => {
    if (err) {
        throw err;
    }

    async.eachLimit(files,
        THREADS,
        (file, callback) => {
            qunit(file, {timeout: 10}, callback);
        },
        (er) => {
            if (er) {
                throw er;
            }
        });
});
