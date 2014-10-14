#!/usr/bin/env node
/*eslint-env node */
/*eslint no-process-exit: 0 */
'use strict';

var program  = require('commander');
var fs = require('fs');
var glob = require('glob');
var bootlint = require('./bootlint.js');
var pack = require('./../package.json');

program
    .version(pack.version)
    .usage('[options] [files...]')
    .option('-d, --disable <IDs>', 'Comma separated list of disabled IDs', function (val) {
        return val.split(',');
    })
    .parse(process.argv);
var disabledIds = program.disable;

var totalErrCount = 0;
var totalFileCount = 0;
program.args.forEach(function (pattern) {
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

console.log("" + totalErrCount + " lint error(s) found across " + totalFileCount + " file(s).");
if (totalErrCount) {
    process.exit(1);
}
