// This file is taken from Bootstrap and adapted for Bootlint.

'use strict';

const path = require('path');

const pkg = require(path.resolve('package.json'));
const year = new Date().getFullYear();

const stampTop =
`/*!
 * Bootlint v${pkg.version} (${pkg.homepage})
 * ${pkg.description}
 * Copyright (c) 2014-${year} The Bootlint Authors
 * Licensed under the MIT License (https://github.com/twbs/bootlint/blob/master/LICENSE).
 */

`;

process.stdout.write(stampTop);
process.stdin.pipe(process.stdout);
