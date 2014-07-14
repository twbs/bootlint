#!/usr/bin/env nodejs

var fs = require('fs');
var bootlint = require('./bootlint.js');

process.argv.slice(2).forEach(function (filename) {
    var html = null;
    try {
        html = fs.readFileSync(filename, {encoding: 'utf8'});
    }
    catch (err) {
        console.log(filename + ":", err);
        return;
    }
    bootlint.lint(html).forEach(function (msg) {
        console.log(filename + ":", msg);
    });
});
