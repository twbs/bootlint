#!/usr/bin/env node
/*eslint-env node */
/*eslint no-process-exit: 0 */
'use strict';

var fs = require('fs');
var glob = require('glob');
var bootlint = require('./bootlint.js');

var totalErrCount = 0;
var totalFileCount = 0;
var disabledIds = [];
var patterns = process.argv.slice(2);
patterns.forEach(function (pattern) {
    var filenames = glob.sync(pattern);

    filenames.forEach(function (filename) {
        var reporter = function (lint) {
            console.log(filename + ":", lint.id, lint.message);
            totalErrCount++;
        };

        var html = null;
        try {
            html = fs.readFileSync(filename, {encoding: 'utf8'});
        }
        catch (err) {
            console.log(filename + ":", err);
            return;
        }
        bootlint.lintHtml(html, reporter, disabledIds);
        totalFileCount++;
    });
});

if (totalErrCount > 0) {
    console.log("\nFor details, look up the lint problem IDs in the Bootlint wiki: https://github.com/twbs/bootlint/wiki");
}

console.log("" + totalErrCount + " lint error(s) found across " + totalFileCount + " file(s).");
if (totalErrCount) {
    process.exit(1);
}
