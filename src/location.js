/*eslint-env node */
var binarySearch = require('binary-search');

(function () {
    'use strict';

    /**
     * Represents a location within a source code file.
     * @param {integer} line A 0-based line index
     * @param {integer} column A 0-based column index
     * @class
     */
    function Location(line, column) {
        this.line = line;
        this.column = column;
    }
    exports.Location = Location;

    /**
     * Maps code unit indices into the string to line numbers and column numbers.
     * @param {string} string String to construct the index for
     * @class
     */
    function LocationIndex(string) {
        // ensure newline termination
        if (string[string.length - 1] !== '\n') {
            string += '\n';
        }
        this._stringLength = string.length;
        /*
         * Each triple in _lineStartEndTriples consists of:
         * [0], the 0-based line index of the line the triple represents
         * [1], the 0-based code unit index (into the string) of the start of the line (inclusive)
         * [2], the 0-based code unit index (into the string) of the start of the next line (or the length of the string, if it is the last line)
         * A line starts with a non-newline character,
         * and always ends in a newline character, unless it is the very last line in the string.
         */
        this._lineStartEndTriples = [[0, 0]];
        var nextLineIndex = 1;
        var charIndex = 0;
        while (charIndex < string.length) {
            charIndex = string.indexOf("\n", charIndex);
            if (charIndex === -1) {
                /* @covignore */
                break;
            }
            charIndex++;// go past the newline
            this._lineStartEndTriples[this._lineStartEndTriples.length - 1].push(charIndex);
            this._lineStartEndTriples.push([nextLineIndex, charIndex]);

            nextLineIndex++;
        }
        this._lineStartEndTriples.pop();
    }
    exports.LocationIndex = LocationIndex;

    /**
     * Translates a code unit index into its corresponding Location (line index and column index) within the string
     * @param {integer} charIndex A 0-based code unit index into the string
     * @returns {Location|null} A Location corresponding to the index, or null if the index is out of bounds
     */
    LocationIndex.prototype.locationOf = function (charIndex) {
        if (charIndex < 0 || charIndex >= this._stringLength) {
            return null;
        }
        var index = binarySearch(this._lineStartEndTriples, charIndex, function (bucket, needle) {
            if (needle < bucket[1]) {
                return 1;
            }
            else if (needle >= bucket[2]) {
                return -1;
            }
            else {
                return 0;
            }
        });
        if (index < 0) { // binarySearch returns a negative number (but not necessarily -1) when match not found
            /* @covignore */
            return null;
        }
        var lineStartEnd = this._lineStartEndTriples[index];
        var lineIndex = lineStartEnd[0];
        var lineStartIndex = lineStartEnd[1];
        var columnIndex = charIndex - lineStartIndex;
        return new Location(lineIndex, columnIndex);
    };
})();
