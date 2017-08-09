# Contributing

## Important notes

Please don't edit files in the `dist` subdirectory as they are generated via `npm run dist`. You'll find source code in the `src` subdirectory!

### Code style

The project's coding style is laid out in the ESLint configuration.

## Modifying the code

First, ensure that you have the latest [Node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/) installed.

1. Fork and clone the repo.
2. Run `npm install` to install all build dependencies.
3. Run `npm test` to build and test things.

Assuming that you don't see any red, you're ready to go. Just be sure to run `npm test` after making any changes, to ensure that nothing is broken.

## Submitting pull requests

1. Create a new branch, please don't work in your `master` branch directly.
2. Add failing tests for the change you want to make. [See the test suite's README for instructions on how to do this.](https://github.com/twbs/bootlint/blob/master/test/README.md) Run `npm test` to see the tests fail.
3. Fix stuff.
4. Run `npm test` to see if the tests pass. Repeat steps 2-4 until done.
5. Update the documentation to reflect any changes.
6. Push to your fork and submit a pull request.

### Licensing

By contributing your code, you agree to license your contribution under [the MIT License](https://github.com/twbs/bootlint/blob/master/LICENSE).
