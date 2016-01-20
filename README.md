# Bootlint
[![NPM version](https://badge.fury.io/js/bootlint.svg)](http://badge.fury.io/js/bootlint)
[![Build Status](https://img.shields.io/travis/twbs/bootlint/master.svg)](https://travis-ci.org/twbs/bootlint)
[![Coverage Status](https://img.shields.io/coveralls/twbs/bootlint.svg?branch=master)](https://coveralls.io/r/twbs/bootlint)
![Development Status :: 5 - Production/Stable](https://img.shields.io/badge/maturity-stable-green.svg "Development Status :: 5 - Production/Stable")
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg "MIT License")](https://github.com/twbs/bootlint/blob/master/LICENSE)
[![Dependency Status](https://david-dm.org/twbs/bootlint.svg)](https://david-dm.org/twbs/bootlint)
[![devDependency Status](https://david-dm.org/twbs/bootlint/dev-status.svg)](https://david-dm.org/twbs/bootlint#info=devDependencies)

An HTML [linter](http://en.wikipedia.org/wiki/Lint_(software)) for [Bootstrap](http://getbootstrap.com) projects

## What's Bootlint?
Bootlint is a tool that checks for several common HTML mistakes in webpages that are using [Bootstrap](http://getbootstrap.com) in a fairly "vanilla" way. Vanilla Bootstrap's components/widgets require their parts of the DOM to conform to certain structures. Bootlint checks that instances of Bootstrap components have correctly-structured HTML. Optimal usage of Bootstrap also requires that your pages include certain `<meta>` tags, an HTML5 doctype declaration, etc.; Bootlint checks that these are present.

### Caveats
Bootlint assumes that your webpage is already valid HTML5. If you need to check HTML5 validity, we recommend tools like [`vnu.jar`](https://validator.github.io/validator/), [grunt-html](https://www.npmjs.org/package/grunt-html), or [grunt-html-validation](https://www.npmjs.org/package/grunt-html-validation).

Bootlint assumes that you are using Bootstrap's default class names in your webpage, as opposed to taking advantage of the "mixins" functionality of Less or Sass to map them to custom class names. If you are using mixins, Bootlint may report some false-positive warnings. However, there are some Bootlint checks that are applicable even if you are using mixins pervasively.

## Getting Started
### Via Grunt

To use Bootlint with [Grunt](http://gruntjs.com/), use the official Grunt plugin: [grunt-bootlint](https://github.com/twbs/grunt-bootlint)

### Via Gulp

If you want to use Bootlint with [Gulp](http://gulpjs.com), there is an *unofficial* Gulp plugin: [gulp-bootlint](https://github.com/tschortsch/gulp-bootlint)

### On the command line
Install the module with: `npm install -g bootlint`

Run it on some HTML files:
```shell
$ bootlint /path/to/some/webpage.html another_webpage.html [...]
```

This will output the lint warnings applicable to each file.

The CLI also accepts a `--disable` (or `-d`) option to disable certain lint checks. `--disable` takes a comma-separated list of [lint problem IDs](https://github.com/twbs/bootlint/wiki). Here's an example:
```shell
$ bootlint -d W002,E020 /path/to/some/webpage.html another_webpage.html [...]
```

The CLI will also process `stdin` input which means that you can pipe into Bootlint:
```shell
$ cat mypage.html | bootlint
```
Or you could use a heredoc (mostly useful for quick testing):
```shell
$ bootlint << EOF
<button class="btn btn-default">Is this correct Bootstrap markup, Bootlint?</button>
EOF
```

### In the browser
Use the following [bookmarklet](https://en.wikipedia.org/wiki/Bookmarklet) that's powered by [BootstrapCDN](http://www.bootstrapcdn.com/#bootlint_tab):
```js
javascript:(function(){var s=document.createElement("script");s.onload=function(){bootlint.showLintReportForCurrentDocument([]);};s.src="https://maxcdn.bootstrapcdn.com/bootlint/latest/bootlint.min.js";document.body.appendChild(s)})();
```
Then check the JavaScript console for lint warning messages.

You can also manually download [the browser-ready version of Bootlint](https://github.com/twbs/bootlint/blob/master/dist/browser/bootlint.js).

Bootlint is also available as a unofficial third-party web service at [bootlint.com](http://www.bootlint.com/) which lints your page simply by entering a URL, similar to the [W3C Markup Validation Service](http://validator.w3.org/). **Please note** that we do *not* operate this service and that it may use an outdated version of Bootlint. Therefore it is not the recommended way to use Bootlint.

## Lint problem explanations
For detailed explanations of each lint problem, [look up the IDs](https://github.com/twbs/bootlint/wiki) (for example, [`E001`](https://github.com/twbs/bootlint/wiki/E001) or [`W002`](https://github.com/twbs/bootlint/wiki/W002)) in [our wiki](https://github.com/twbs/bootlint/wiki).

## API Documentation
Bootlint is a [CommonJS module](http://wiki.commonjs.org/wiki/Modules/1.1).

Bootlint represents the lint problems it reports using the `LintError` and `LintWarning` classes:
* `LintWarning`
  * Represents a potential error. It may have false-positives.
  * Constructor: `LintWarning(id, message, elements)`
  * Properties:
    * `id` - Unique string ID for this type of lint problem. Of the form "W###" (e.g. "W123").
    * `message` - Human-readable string describing the problem
    * `elements` - jQuery or Cheerio collection of referenced DOM elements pointing to all problem locations in the document
      * (**Only available under Node.js**): When available from the underlying HTML parser (which is most of the time), the DOM elements in the collection will have a `.startLocation` property that is a `Location` (see below) indicating the location of the element in the document's HTML source
* `LintError`
  * Represents an error. Under the assumptions explained in the above "Caveats" section, it should never have any false-positives.
  * Constructor: `LintError(id, message, elements)`
  * Properties:
    * `id` - Unique string ID for this type of lint problem. Of the form "E###" (e.g. "E123").
    * `message` - Human-readable string describing the problem
    * `elements` - jQuery or Cheerio collection of referenced DOM elements pointing to all problem locations in the document
      * (**Only available under Node.js**): When available from the underlying HTML parser (which is most of the time), the DOM elements in the collection will have a `.startLocation` property that is a `Location` (see below) indicating the location of the element in the document's HTML source

Bootlint defines the following public utility class:
* `Location` (**Only available under Node.js**)
  * Represents a location in the HTML source
  * Constructor: `Location(line, column)`
  * Properties:
    * `line` - 0-based line number
    * `column` - 0-based column number

A ***reporter*** is a function that accepts exactly 1 argument of type `LintWarning` or `LintError`. Its return value is ignored. It should somehow record the problem or display it to the user.

### Browser
Bootlint exports a `bootlint` property on the global `window` object.
In a browser environment, the following public APIs are available:

* `bootlint.lintCurrentDocument(reporter, disabledIds)`: Lints the HTML of the current document and calls the `reporter()` function repeatedly with each lint problem as an argument.
  * `reporter` is a *reporter* function (see above for a definition). It will be called repeatedly with each lint problem as an argument.
  * `disabledIds` is an array of string linter IDs to disable
  * Returns nothing (i.e. `undefined`)
* `bootlint.showLintReportForCurrentDocument(disabledIds, alertOpts)`: Lints the HTML of the current document and reports the linting results to the user. Each warning will be output individually using `console.warn()`.
  * `disabledIds` is an array of string linter IDs to disable
  * `alertOpts` is an optional options object with the following properties:
    * `hasProblems` (type: `boolean`; default: `true`) - `window.alert()` a single general notification message to the user if there are any lint problems?
    * `problemFree` (type: `boolean`; default: `true`) - `window.alert()` a notification message to the user if the document has no lint problems?
  * Returns nothing (i.e. `undefined`)

### Node.js

Example:

```js
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

### HTTP API

Bootlint can also be run as an HTTP server that exposes a very simple API. Use `npm run start` to run the server.

By default, it runs on port `7070`. Set the `$PORT` environment variable to change which port it uses.

POST an HTML document to `/` and the document's lint problems will be returned as JSON.

The endpoint accepts an optional querystring argument named `disable`, whose value is a comma-separated list of linter IDs to disable.

Example:
```http
Request:
  POST / HTTP/1.1
  Content-Type: text/html

  <!DOCTYPE html>
  ...

Response:
  HTTP/1.1 200 OK
  Content-Type: application/json

  [
    {
      "id": "W003",
      "message": "<head> is missing viewport <meta> tag that enables responsiveness"
    },
    {
      "id": "W005",
      "message": "Unable to locate jQuery, which is required for Bootstrap's JavaScript plugins to work"
    },
    ...
  ]
```

## Contributing
The project's coding style is laid out in the JSHint, ESLint, and JSCS configurations. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

_Also, please don't edit files in the "dist" subdirectory as they are generated via Grunt. You'll find source code in the "src" subdirectory!_

## Release History
See the [GitHub Releases page](https://github.com/twbs/bootlint/releases) for detailed changelogs.
* (next release) - `master`
* 2015-11-25 - v0.14.2: Fix critical CLI bug introduced in v0.14.0 and add tests to prevent its recurrence. Update current Bootstrap version to v3.3.6.
* 2015-11-16 - v0.14.1: Forgot to regenerate browser version when tagging v0.14.0
* 2015-11-16 - v0.14.0: Adds 3 new lint checks.
* 2015-11-15 - v0.13.0: Removes E036. Adds a few new checks. Bumps dependency versions.
* 2015-03-16 - v0.12.0: Adds warning if Bootstrap v4 is detected (since Bootlint is currently only compatible with Bootstrap v3). Minor fixes to some existing lint checks.
* 2015-02-23 - v0.11.0: Adds several new lint checks. Improves stdin handling. Bumps dependency versions.
* 2015-01-21 - v0.10.0: By default, the in-browser version now `alert()`s when no lint problems are found. Adds validity check for carousel control & indicator targets.
* 2015-01-07 - v0.9.2: Fixes a problem when using the CLI via node's `child_process.exec`.
* 2014-12-19 - v0.9.1: Fixes a W013 false positive.
* 2014-12-18 - v0.9.0: Fixes several small bugs and tweaks a few existing checks. Adds 4 new lint checks.
* 2014-11-07 - v0.8.0: When in a Node.js environment, report the locations of the HTML source code of problematic elements.
* 2014-11-01 - v0.7.0: Tweaks lint message texts. Adds 1 new lint check.
* 2014-10-31 - v0.6.0: Fixes crash bug. Adds some new lint checks. Adds HTTP API.
* 2014-10-16 - v0.5.0: Adds several new features. Add official bookmarklet. Disables auto-lint-on-load in browser. Tweaks some checks. **Not backward compatible**
* 2014-10-07 - v0.4.0: Adds checks for correct Glyphicon usage and correct modal DOM structure; fixes `.panel-footer` false positive
* 2014-09-26 - v0.3.0: Several bug fixes and enhancements. **Not backward compatible**
* 2014-09-23 - v0.2.0: First formal release. Announcement: http://blog.getbootstrap.com/2014/09/23/bootlint/

## License

Copyright (c) 2014-2015 Christopher Rebert. Licensed under the MIT License.
