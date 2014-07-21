# Bootlint
[![NPM version](https://badge.fury.io/js/bootlint.svg)](http://badge.fury.io/js/bootlint)
[![Build Status](https://travis-ci.org/cvrebert/bootlint.svg?branch=master)](https://travis-ci.org/cvrebert/bootlint)
[![Dependency Status](https://david-dm.org/cvrebert/bootlint.svg)](https://david-dm.org/cvrebert/bootlint)
[![devDependency Status](https://david-dm.org/cvrebert/bootlint/dev-status.svg)](https://david-dm.org/cvrebert/bootlint#info=devDependencies)

HTML linter for Bootstrap projects

## Getting Started
### On the command line
Install the module with: `npm install -g bootlint`

Run it on some HTML files:
```
$ bootlint /path/to/some/webpage.html another_webpage.html [...]
```

This will output the lint warnings applicable to each file.

### In the browser
Download [the code](https://raw.github.com/cvrebert/bootlint/master/dist/browser/bootlint.js).

In your webpage:

```html
<script src="dist/browser/bootlint.js"></script>
```

Then check the JavaScript console for lint warning messages.

## API Documentation

Bootlint is a CommonJS module.

### Browser

Bootlint exports a `bootlint` property on the global `window` object.
In a browser environment, the following public APIs are available:

* `bootlint.lintCurrentDocument()`: Lints the HTML of the current document and returns the linting results.
  * Returns an array of lint warning strings
* `bootlint.showLintReportForCurrentDocument()`: Lints the HTML of the current document and reports the linting results to the user.
  * If there are any lint warnings, one general notification message will be `window.alert()`-ed to the user. Each warning will be output individually using `console.warn()`.
  * Returns nothing (i.e. `undefined`)

### Node.js

Example:

```javascript
var bootlint = require('bootlint');
bootlint.lintHtml("<!DOCTYPE html><html>..."); // returns list of lint warning messages
```

In a Node.js environment, Bootlint exposes the following public API:

* `bootlint.lintHtml(html)`: Lints the given HTML for a webpage and returns the linting results.
  * Has 1 required parameter: the HTML to lint, as a string
  * Returns an array of lint warning strings

## Contributing
The project's coding style is laid out in the JSHint and JSCS configurations. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

_Also, please don't edit files in the "dist" subdirectory as they are generated via Grunt. You'll find source code in the "lib" subdirectory!_

## Release History
_(Nothing yet)_

## License

Copyright (c) 2014 Christopher Rebert. Licensed under the MIT license.
