# Bootlint
[![NPM version](https://badge.fury.io/js/bootlint.svg)](http://badge.fury.io/js/bootlint)
[![Build Status](https://travis-ci.org/twbs/bootlint.svg?branch=master)](https://travis-ci.org/twbs/bootlint)
[![Dependency Status](https://david-dm.org/twbs/bootlint.svg)](https://david-dm.org/twbs/bootlint)
[![devDependency Status](https://david-dm.org/twbs/bootlint/dev-status.svg)](https://david-dm.org/twbs/bootlint#info=devDependencies)

An HTML [linter](http://en.wikipedia.org/wiki/Lint_(software)) for [Bootstrap](http://getbootstrap.com) projects

## What's Bootlint?
Bootlint is a tool that checks for several common HTML mistakes in webpages that are using [Bootstrap](http://getbootstrap.com) in a fairly "vanilla" way. Vanilla Bootstrap's components/widgets require their parts of the DOM to conform to certain structures. Bootlint checks that instances of Bootstrap components have correctly-structured HTML. Optimal usage of Bootstrap also requires that your pages include certain `<meta>` tags, an HTML5 doctype declaration, etc.; Bootlint checks that these are present.

### Caveats
Bootlint assumes that your webpage is already valid HTML5. If you need to check HTML5 validity, we recommend tools like [`vnu.jar`](https://github.com/validator/validator.github.io), [grunt-html](https://www.npmjs.org/package/grunt-html), or [grunt-html-validation](https://www.npmjs.org/package/grunt-html-validation).

Bootlint assumes that you are using Bootstrap's default class names in your webpage, as opposed to taking advantage of the "mixins" functionality of Less or Sass to map them to custom class names. If you are using mixins, Bootlint may report some false-positive warnings. However, there are some Bootlint checks that are applicable even if you are using mixins pervasively.

## Getting Started
### On the command line
Install the module with: `npm install -g bootlint`

Run it on some HTML files:
```
$ bootlint /path/to/some/webpage.html another_webpage.html [...]
```

This will output the lint warnings applicable to each file.

### In the browser
Download [the code](https://raw.github.com/twbs/bootlint/master/dist/browser/bootlint.js).

In your webpage:

```html
<script src="dist/browser/bootlint.js"></script>
```

Then check the JavaScript console for lint warning messages.

## API Documentation
Bootlint is a [CommonJS module](http://wiki.commonjs.org/wiki/Modules/1.1).

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
The project's coding style is laid out in the JSHint, ESLint, and JSCS configurations. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

_Also, please don't edit files in the "dist" subdirectory as they are generated via Grunt. You'll find source code in the "src" subdirectory!_

## Release History
* 2014-09-23 - v0.2.0: First formal release. Announcement: http://blog.getbootstrap.com/2014/09/23/bootlint/

## License

Copyright (c) 2014 Christopher Rebert. Licensed under the MIT license.
