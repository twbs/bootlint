# Bootlint

[![NPM version](https://img.shields.io/npm/v/bootlint.svg)](https://www.npmjs.com/package/bootlint)
[![Build Status](https://img.shields.io/travis/twbs/bootlint/master.svg)](https://travis-ci.org/twbs/bootlint)
[![Coverage Status](https://img.shields.io/coveralls/twbs/bootlint.svg?branch=master)](https://coveralls.io/r/twbs/bootlint)
![Development Status :: 5 - Production/Stable](https://img.shields.io/badge/maturity-stable-green.svg "Development Status :: 5 - Production/Stable")
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg "MIT License")](https://github.com/twbs/bootlint/blob/master/LICENSE)
[![Dependency Status](https://img.shields.io/david/twbs/bootlint.svg)](https://david-dm.org/twbs/bootlint)
[![devDependency Status](https://img.shields.io/david/dev/twbs/bootlint.svg)](https://david-dm.org/twbs/bootlint?type=dev)

An HTML [linter](https://en.wikipedia.org/wiki/Lint_%28software%29) for [Bootstrap](https://getbootstrap.com/) projects

## What's Bootlint?

Bootlint is a tool that checks for several common HTML mistakes in webpages that are using [Bootstrap](https://getbootstrap.com/) in a fairly "vanilla" way. Vanilla Bootstrap's components/widgets require their parts of the DOM to conform to certain structures. Bootlint checks that instances of Bootstrap components have correctly-structured HTML. Optimal usage of Bootstrap also requires that your pages include certain `<meta>` tags, an HTML5 doctype declaration, etc.; Bootlint checks that these are present.

### Caveats

Bootlint assumes that your webpage is already valid HTML5. If you need to check HTML5 validity, we recommend tools like [`vnu.jar`](https://validator.github.io/validator/) or [grunt-html](https://www.npmjs.org/package/grunt-html).

Bootlint assumes that you are using Bootstrap's default class names in your webpage, as opposed to taking advantage of the "mixins" functionality of Less or Sass to map them to custom class names. If you are using mixins, Bootlint may report some false-positive warnings. However, there are some Bootlint checks that are applicable even if you are using mixins pervasively.

## Getting Started

### Via Grunt

To use Bootlint with [Grunt](https://gruntjs.com/), use the official Grunt plugin: [grunt-bootlint](https://github.com/twbs/grunt-bootlint).

### Via Gulp

If you want to use Bootlint with [Gulp](https://gulpjs.com/), there is an *unofficial* Gulp plugin: [gulp-bootlint](https://github.com/tschortsch/gulp-bootlint)

### On the command line

Install the module with: `npm install -g bootlint`

Run it on some HTML files:

```shell
bootlint /path/to/some/webpage.html another_webpage.html [...]
```

This will output the lint warnings applicable to each file.

The CLI also accepts a `--disable` (or `-d`) option to disable certain lint checks. `--disable` takes a comma-separated list of [lint problem IDs](https://github.com/twbs/bootlint/wiki). Here's an example:

```shell
bootlint -d W002,E020 /path/to/some/webpage.html another_webpage.html [...]
```

The CLI will also process `stdin` input which means that you can pipe into Bootlint:

```shell
cat mypage.html | bootlint
```

Or you could use a heredoc (mostly useful for quick testing):

```shell
bootlint << EOF
<button class="btn btn-default">Is this correct Bootstrap markup, Bootlint?</button>
EOF
```

### In the browser

Bootlint can run directly in the browser! This is accomplished by using a [bookmarklet](https://en.wikipedia.org/wiki/Bookmarklet), which appends bootlint to the body of the active page. There are a few nice benefits of running bootlint directly in the browser. They include:

1. Evaluating page markup after AJAX requests complete.
2. Evaluating pages that are dynamically created server-side (ex: CMS).
3. Evaluating pages/sites that do not have a build script.

#### How to install the bookmarklet

Please follow the instructions below to get up and running:

1. Create a new bookmark in your browser
2. Set the name/title equal to something that is easy to remember. Ex: Run Bootlint
3. Set the URL equal to

```js
javascript:(function(){var s=document.createElement("script");s.onload=function(){bootlint.showLintReportForCurrentDocument([]);};s.src="https://stackpath.bootstrapcdn.com/bootlint/latest/bootlint.min.js";document.body.appendChild(s)})();
```

Note: The snippet above will ensure you are always running the latest version of bootlint. If you want to reference a specific version of bootlint please see the [BootstrapCDN](https://www.bootstrapcdn.com/bootlint/). Copy the URL and update `s.src="PASTE-ME-HERE"`.

#### How to use the bookmarklet

1. Click the bookmark you created above
2. A popup will appear informing you if issues were detected
3. If issues exist, please open the developer tools and select the console tab

#### Alternative Options

##### Browser ready script

You can manually download [the browser-ready version of Bootlint](https://github.com/twbs/bootlint/blob/master/dist/browser/bootlint.js).

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

Bootlint can also be run as an HTTP server that exposes a very simple API. See [https://github.com/twbs/bootlint-server](bootlint-server).

## Contributing

The project's coding style is laid out in the ESLint configuration. Add unit tests for any new or changed functionality. Lint and test your code using the npm scripts.

_Also, please don't edit files in the "dist" subdirectory as they are generated via `npm run dist`. You'll find the source code in the "src" subdirectory!_

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
* 2014-10-16 - v0.5.0: Adds several new features. Adds official bookmarklet. Disables auto-lint-on-load in browser. Tweaks some checks. **Not backward compatible**
* 2014-10-07 - v0.4.0: Adds checks for correct Glyphicon usage and correct modal DOM structure; fixes `.panel-footer` false positive
* 2014-09-26 - v0.3.0: Several bug fixes and enhancements. **Not backward compatible**
* 2014-09-23 - v0.2.0: First formal release. Announcement: <https://blog.getbootstrap.com/2014/09/23/bootlint/>

## License

Copyright (c) 2014-2019 The Bootlint Authors. Licensed under the MIT License.
