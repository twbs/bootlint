/* This file is taken from <https://github.com/twbs/bootstrap/blob/v4-dev/build/stamp.js>
   and adapted for Bootlint.
 */

/* eslint-env node */

'use strict';

var fs = require('fs');

fs.readFile('package.json', function (err, data) {
    if (err) {
        throw err;
    }

    var pkg = JSON.parse(data);
    var year = new Date().getFullYear();

    var stampTop = '/*!\n * Bootlint v' + pkg.version + ' (' + pkg.homepage + ')\n' +
            ' * ' + pkg.description + '\n' +
            ' * Copyright (c) 2014-' + year + ' The Bootlint Authors\n' +
            ' * Licensed under the MIT License (https://github.com/twbs/bootlint/blob/master/LICENSE).\n' +
            ' */\n';

    process.stdout.write(stampTop);

    process.stdin.pipe(process.stdout);
});
