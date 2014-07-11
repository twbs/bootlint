# bootlint
[![Build Status](https://travis-ci.org/cvrebert/bootlint.svg?branch=master)](https://travis-ci.org/cvrebert/bootlint)
[![Dependency Status](https://david-dm.org/cvrebert/bootlint.svg)](https://david-dm.org/cvrebert/bootlint)
[![devDependency Status](https://david-dm.org/cvrebert/bootlint/dev-status.svg)](https://david-dm.org/cvrebert/bootlint#info=devDependencies)

HTML linter for Bootstrap projects

## Getting Started
### On the server
Install the module with: `npm install bootlint`

```javascript
var bootlint = require('bootlint');
bootlint.awesome(); // "awesome"
```

### In the browser
Download [the code](https://raw.github.com/cvrebert/bootlint/master/dist/bootlint.js).

In your webpage:

```html
<script src="dist/bootlint.js"></script>
<script>
awesome(); // "awesome"
</script>
```

## Documentation
_(Coming soon)_

## Contributing
The project's coding style is laid out in the JSHint and JSCS configurations. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

_Also, please don't edit files in the "dist" subdirectory as they are generated via Grunt. You'll find source code in the "lib" subdirectory!_

## Release History
_(Nothing yet)_

## License

Copyright (c) 2014 Christopher Rebert. Licensed under the MIT license.
