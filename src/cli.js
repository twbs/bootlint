#!/usr/bin/env node
/*eslint-env node */
/*eslint no-process-exit: 0 */
'use strict';

var chalk = require('chalk');
var program = require('commander');
var fs = require('fs');
var glob = require('glob');
var npmCheck = require('npm-check');
var semver = require('semver');
var bootlint = require('./bootlint.js');
var packageJson = require('./../package.json');

npmCheck({
    global: true
}).then(function (result) {
    if (result.bootlint) {
        if (!semver.gte(result.bootlint.installed, result.bootlint.latest, true)) {
            console.log('You are running version ' + chalk.bgRed.white(result.bootlint.installed) + ' and the latest version is ' + chalk.bgGreen.white(result.bootlint.latest) + '.\nPlease update with `npm update -g bootlint`');
        }
    }

    program
        .version(packageJson.version)
        .usage('[options] [files...]')
        .option('-d, --disable <IDs>', 'Comma-separated list of disabled lint problem IDs', function (val) {
            return val.split(',');
        })
        .parse(process.argv);
    var disabledIds = program.disable === undefined ? [] : program.disable;

    var totalErrCount = 0;
    var totalFileCount = 0;
    program.args.forEach(function (pattern) {
        var filenames = glob.sync(pattern);

        filenames.forEach(function (filename) {
            var reporter = function (lint) {
                var lintId = (lint.id[0] === 'E') ? chalk.bgGreen.white(lint.id) : chalk.bgRed.white(lint.id);
                console.log(filename + ":", lintId, lint.message);
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

    console.log("");

    if (totalErrCount > 0) {
        console.log("For details, look up the lint problem IDs in the Bootlint wiki: https://github.com/twbs/bootlint/wiki");
    }

    console.log("" + totalErrCount + " lint error(s) found across " + totalFileCount + " file(s).");
    if (totalErrCount) {
        process.exit(1);
    }
});
