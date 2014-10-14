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
### Via Grunt

To use Bootlint with [Grunt](http://gruntjs.com/), use the official Grunt plugin: [grunt-bootlint](https://github.com/zacechola/grunt-bootlint)

### On the command line
Install the module with: `npm install -g bootlint`

Run it on some HTML files:
```
$ bootlint /path/to/some/webpage.html another_webpage.html [...]
```

This will output the lint warnings applicable to each file.

### In the browser
[Use the CDN](http://www.bootstrapcdn.com/#bootlint_tab) provided by the fine folks at BootstrapCDN, or [download the code](https://raw.github.com/twbs/bootlint/master/dist/browser/bootlint.js), and insert a `<script>` tag for Bootlint into your webpage.
Then check the JavaScript console for lint warning messages.

## Lint problem explanations
For detailed explanations of each lint problem, [look up the IDs](https://github.com/twbs/bootlint/wiki) (for example, [`E001`](https://github.com/twbs/bootlint/wiki/E001) or [`W002`](https://github.com/twbs/bootlint/wiki/W002)) in [our wiki](https://github.com/twbs/bootlint/wiki).

These IDs can be passed into the command line tool by using the the `--disable` or `-d` option.

```
$ bootlint -d E002,E020 /path/to/some/webpage.html another_webpage.html [...]
```

## API Documentation
Bootlint is a [CommonJS module](http://wiki.commonjs.org/wiki/Modules/1.1).

Bootlint represents the lint problems it reports using the `LintError` and `LintWarning` classes:
* `LintWarning`
  * Represents a potential error. It may have false-positives.
  * Constructor: `LintWarning(id, message)`
  * Properties:
    * `id` - Unique string ID for this type of lint problem. Of the form "W###" (e.g. "W123").
    * `message` - Human-readable string describing the problem
* `LintError`
  * Represents an error. Under the assumptions explained in the above "Caveats" section, it should never have any false-positives.
  * Constructor: `LintError(id, message)`
  * Properties:
    * `id` - Unique string ID for this type of lint problem. Of the form "E###" (e.g. "E123").
    * `message` - Human-readable string describing the problem

A ***reporter*** is a function that accepts exactly 1 argument of type `LintWarning` or `LintError`. Its return value is ignored. It should somehow record the problem or display it to the user.

### Browser
Bootlint exports a `bootlint` property on the global `window` object.
In a browser environment, the following public APIs are available:

* `bootlint.lintCurrentDocument(reporter, disabledIds)`: Lints the HTML of the current document and calls the `reporter()` function repeatedly with each lint problem as an argument.
  * `reporter` is a *reporter* function (see above for a definition). It will be called repeatedly with each lint problem as an argument.
  * `disabledIds` is an array of string linter IDs to disable
  * Returns nothing (i.e. `undefined`)
* `bootlint.showLintReportForCurrentDocument(disabledIds)`: Lints the HTML of the current document and reports the linting results to the user.
  * If there are any lint warnings, one general notification message will be `window.alert()`-ed to the user. Each warning will be output individually using `console.warn()`.
  * `disabledIds` is an array of string linter IDs to disable
  * Returns nothing (i.e. `undefined`)

In a browser environment, after Bootlint has loaded, `bootlint.showLintReportForCurrentDocument([])` will be executed once.

### Node.js

Example:

```javascript
var bootlint = require('bootlint');

function reporter(lint) {
    console.log(lint.id, lint.message);
}

bootlint.lintHtml("<!DOCTYPE html><html>...", reporter, []); // calls reporter() repeatedly with each lint problem as an argument
```

In a Node.js environment, Bootlint exposes the following public API:

* `bootlint.lintHtml(html, reporter, disabledIds)`: Lints the given HTML for a webpage and returns the linting results.
  * `html` is the HTML to lint, as a string
  * `reporter` is a *reporter* function (see above for a definition). It will be called repeatedly with each lint problem as an argument.
  * `disabledIds` is an array of string linter IDs to disable
  * Returns nothing (i.e. `undefined`)

## Contributing
The project's coding style is laid out in the JSHint, ESLint, and JSCS configurations. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

_Also, please don't edit files in the "dist" subdirectory as they are generated via Grunt. You'll find source code in the "src" subdirectory!_

## Release History
See the [GitHub Releases page](https://github.com/twbs/bootlint/releases) for detailed changelogs.
* 2014-10-07 - v0.4.0: Add checks for correct Glyphicon usage and correct modal DOM structure; fix `.panel-footer` false positive
* 2014-09-26 - v0.3.0: Several bug fixes and enhancements. **Not backward compatible**
* 2014-09-23 - v0.2.0: First formal release. Announcement: http://blog.getbootstrap.com/2014/09/23/bootlint/

## License

Copyright (c) 2014 Christopher Rebert. Licensed under the MIT license.
