/*!
 * bootlint - https://github.com/cvrebert/bootlint
 * Copyright (c) 2014 Christopher Rebert
 * Licensed under the MIT license.
 */

(function (exports) {
    'use strict';

    var COL_CLASSES = [];
    var SCREENS = ['xs', 'sm', 'md', 'lg'];
    SCREENS.forEach(function (screen) {
        for (var n = 1; n <= 12; n++) {
            COL_CLASSES.push('.col-' + screen + '-' + n);
        }
    });

    exports.lintMetaCharsetUtf8 = function ($) {
        var meta = $('head>meta[charset]');
        var charset = meta.attr('charset');
        if (!charset) {
            return '<head> is missing UTF-8 charset <meta> tag';
        }
        if (charset.toLowerCase() !== "utf-8") {
            return 'charset <meta> tag is specifying a legacy, non-UTF-8 charset';
        }
        return null;
    };
    exports.lintXUaCompatible = function ($) {
        var meta = $('head>meta[http-equiv="X-UA-Compatible"][content="IE=edge"]');
        if (!meta.length) {
            return "<head> is missing X-UA-Compatible <meta> tag that disables old IE compatibility modes";
        }
        return null;
    };
    exports.lintViewport = function ($) {
        var meta = $('head>meta[name="viewport"][content]');
        if (!meta.length) {
            return "<head> is missing viewport <meta> tag that enables responsiveness";
        }
        return null;
    };
    exports.lintBootstrapv2 = function ($) {
        var columnClasses = [];
        for (var n = 1; n <= 12; n++) {
            columnClasses.push('.span' + n);
        }
        var selector = columnClasses.join(',');
        var spanNs = $(selector);
        if (spanNs.length) {
            return "Found one or more uses of outdated Bootstrap v2 `.spanN` grid classes";
        }
        return null;
    };
    exports.lintContainers = function ($) {
        var rows = $('.row');
        var rowsOutsideContainers = rows.filter(function (i, row) {
            var parent = $(row).parent();
            return !parent.hasClass('container') && !parent.hasClass('container-fluid');
        });
        if (rowsOutsideContainers.length) {
            return "Found one or more `.row`s that were not children of a `.container` or `.container-fluid`";
        }
        return null;
    };
    exports.lintRowAndColOnSameElem = function ($) {
        var selector = COL_CLASSES.map(function (col) { return ".row" + col; }).join(',');
        var rowCols = $(selector);
        if (rowCols.length) {
            return "Found both `.row` and `.col-*-*` used on the same element";
        }
        return null;
    };
    exports.lint = function (html) {
        var cheerio = require('cheerio');
        var $ = cheerio.load(html);
        var errs = [];
        errs.push(this.lintMetaCharsetUtf8($));
        errs.push(this.lintXUaCompatible($));
        errs.push(this.lintBootstrapv2($));
        errs.push(this.lintContainers($));
        errs.push(this.lintViewport($));
        errs.push(this.lintRowAndColOnSameElem($));
        errs = errs.filter(function (item) { return item !== null; });
        return errs;
    };

}(typeof exports === 'object' && exports || this));
