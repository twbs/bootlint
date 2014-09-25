#!/usr/bin/env node
/*eslint-env node */
/*eslint no-process-exit: 0 */
'use strict';

var fs = require('fs');
var glob = require('glob');
var bootlint = require('./bootlint.js');

var totalErrCount = 0;
var totalFileCount = 0;
var patterns = process.argv.slice(2);
patterns.forEach(function (pattern) {
    var filenames = glob.sync(pattern);

    filenames.forEach(function (filename) {
        var html = null;
        try {
            html = fs.readFileSync(filename, {encoding: 'utf8'});
        }
        catch (err) {
            console.log(filename + ":", err);
            return;
        }
        var errs = bootlint.lintHtml(html);
        totalErrCount += errs.length;
        totalFileCount++;
        errs.forEach(function (msg) {
            console.log(filename + ":", msg);
        });
    });
});

console.log("" + totalErrCount + " lint errors found across " + totalFileCount + " files.");
if (totalErrCount) {
    process.exit(1);
}
