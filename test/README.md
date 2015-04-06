## How does Bootlint's test suite work?

* `/test/fixtures/` contains the HTML test case files.
* `/test/lib/` contains third-party testing-related code for the browser environment (jQuery and QUnit)

To test usage in a Node.js environment, [Nodeunit](https://github.com/caolan/nodeunit) tests are defined in `/test/bootlint_test.js`, and can be run via the `nodeunit` Grunt task.

To test usage in a browser environment, we use [QUnit](http://qunitjs.com) along with some additional automation in `/test/fixtures/generic-qunit.js`. Basically, when PhantomJS runs each test case webpage, we automatically Bootlint the page and then assert that the list of lint messages equals the `data-lint` attributes of the `<li>`s under the `<ol id="bootlint">` within the page. The `qunit` Grunt task runs these tests in PhantomJS.


## How do I add a new test?

1. Copy the `/test/fixtures/doctype/html5-normal.html` test case to a new file.
2. Add the HTML of your new testcase into the new file.
3. For each lint message you expect Bootlint to emit, add an `<li>` under the `<ol id="bootlint">` in the file, and add a `data-lint` attribute to the `<li>` with the lint message string as the value (see existing tests for examples).
4. In `/test/bootlint_test.js`, add a corresponding Nodeunit test that uses your new test case file. (Yes, this involves duplicating the expected lint messages.)
5. Run `grunt test` to see the results of your newly-added test.
