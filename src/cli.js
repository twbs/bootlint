#!/usr/bin/env node
/*eslint-env node */
/*eslint no-process-exit: 0 */
'use strict';

var fs = require('fs');
var bootlint = require('./bootlint.js');

var totalErrCount = 0;
var filenames = process.argv.slice(2);
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
    errs.forEach(function (msg) {
        console.log(filename + ":", msg);
    });
});

console.log("" + totalErrCount + " lint errors found across " + filenames.length + " files.");
if (totalErrCount) {
    process.exit(1);
}
