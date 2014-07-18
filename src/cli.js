#!/usr/bin/env node

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
    var errs = bootlint.lint(html);
    totalErrCount += errs.length;
    errs.forEach(function (msg) {
        console.log(filename + ":", msg);
    });
});

console.log("" + totalErrCount + " lint errors found across " + filenames.length + " files.");
if (totalErrCount) {
    process.exit(1);
}
