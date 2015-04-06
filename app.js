/**
Bootlint HTTP server API
Run it via: npm run start
This is pretty niche. Most users should probably use the CLI or bookmarklet instead.
*/

/*eslint-env node */

'use strict';

var bootlint = require('./src/bootlint');
var _extend = require('util')._extend;
var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');


var HTML_MIME_TYPES = [
    'text/html',
    'application/xhtml+xml'
];

function shallowClone(obj) {
    return _extend({}, obj);
}

function disabledIdsFor(req) {
    var rawIds = req.query.disable;
    if (!rawIds) {
        return [];
    }
    return rawIds.split(',');
}

function lintsFor(html, disabledIds) {
    var lints = [];
    var reporter = function (lint) {
        var output = false;
        if (lint.elements && lint.elements.length) {
            var elements = lint.elements;
            lint.elements = undefined;
            elements.each(function (_, element) {
                if (element.startLocation) {
                    var locatedLint = shallowClone(lint);
                    locatedLint.location = element.startLocation;
                    lints.push(locatedLint);
                    output = true;
                }
            });
        }
        if (!output) {
            lint.elements = undefined;
            lints.push(lint);
        }
    };
    bootlint.lintHtml(html, reporter, disabledIds);
    return lints;
}


/*eslint-disable new-cap */
var routes = express.Router();
/*eslint-enable new-cap */

routes.get('/', function (req, res) {
    res.status(200).json({status: 200, message: 'Bootlint is online!'});
});

routes.post('/', function (req, res) {
    var isHtml = HTML_MIME_TYPES.some(function (type) {
        return req.is(type);
    });
    if (!isHtml) {
        res.status(415).json({status: 415, message: 'Unsupported Media Type', details: 'Content-Type was not an HTML MIME type'});
        return;
    }

    res.format({
        'application/json': function () {
            var disabledIds = disabledIdsFor(req);
            var html = req.body;
            // console.log("HTML: ", html);
            var lints = lintsFor(html, disabledIds);
            res.status(200).json(lints);
        },
        'default': function () {
            res.status(406).json({status: 406, message: 'Not Acceptable', details: '"Accept" header must allow MIME type application/json'});
        }
    });
});


var app = express();

app.use(logger('dev'));
HTML_MIME_TYPES.forEach(function (type) {
    app.use(bodyParser.text({type: type}));
});

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace

/*eslint-disable no-unused-vars */
app.use(function (err, req, res, next) {
    var isHttpErr = !!err.status;

    if (!isHttpErr) {
        err.status = 500;
    }

    var errJson = {
        status: err.status,
        message: err.message
    };
    if (!isHttpErr) {
        errJson.stack = err.stack;
    }

    res.status(err.status).json(errJson);
});
/*eslint-enable no-unused-vars */


module.exports = app;
