/*eslint-env node, browser */
/* jshint browser: true */
/**
 * Simple lightweight shim of Node.js's `url.parse()`
 * ( http://nodejs.org/docs/latest/api/url.html )
 * for use within browsers.
 */
(function () {
    'use strict';

    // Only properties common to both browsers and Node.js are supported.
    // For what browsers support, see https://developer.mozilla.org/en-US/docs/Web/API/URLUtils
    var URL_PROPERTIES = [
        'hash',
        'host',
        'hostname',
        'href',
        'pathname',
        'port',
        'protocol',
        'search'
    ];

    /**
     * @param {string} urlStr URL to parse
     * @returns {object} Object with fields representing the various parts of the parsed URL.
     */
    function parse(urlStr) {
        var anchor = document.createElement('a');
        anchor.href = urlStr;
        var urlObj = {};
        URL_PROPERTIES.forEach(function (property) {
            urlObj[property] = anchor[property];
        });
        return urlObj;
    }
    exports.parse = parse;
})();
