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
    exports.lint = function (html) {
        var cheerio = require('cheerio');
        var $ = cheerio.load(html);
        var errs = [];
        errs.push(this.lintMetaCharsetUtf8($));
        errs = errs.filter(function (item) { return item !== null; });
        return errs;
    };

}(typeof exports === 'object' && exports || this));
