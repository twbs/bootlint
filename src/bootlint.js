/*!
 * bootlint - https://github.com/cvrebert/bootlint
 * Copyright (c) 2014 Christopher Rebert
 * Licensed under the MIT license.
 */

(function (exports) {
    'use strict';

    exports.lintMetaCharsetUtf8 = function ($) {
        var meta = $('head>meta[charset]');
        var charset = meta.attr('charset');
        if (!charset) {
            return '<head> is missing UTF-8 charset <meta> tag';
        }
        if (charset.toLowerCase() !== "utf-8") {
            return 'charset meta tag is specifying a legacy, non-UTF-8 charset';
        }
        return null;
    };
    exports.lintXUaCompatible = function ($) {
        var meta = $('head>meta[http-equiv="X-UA-Compatible"][content="IE=edge"]');
        if (!meta.length) {
            return "<head> is missing X-UA-Compatible meta tag that disables old IE compatibility modes";
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
    exports.lint = function (html) {
        var cheerio = require('cheerio');
        var $ = cheerio.load(html);
        var errs = [];
        errs.push(this.lintMetaCharsetUtf8($));
        errs.push(this.lintXUaCompatible($));
        errs.push(this.lintBootstrapv2($));
        errs = errs.filter(function (item) { return item !== null; });
        return errs;
    };

}(typeof exports === 'object' && exports || this));
