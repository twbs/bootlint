#!/bin/bash
# Copyright 2011-2014 Twitter, Inc.
# Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
set -e
cd ..  # /bootlint/
cp test-infra/npm-shrinkwrap.json npm-shrinkwrap.json
# npm is flaky, so try multiple times
MAXTRIES=3
TRIES=1
while ! npm install; do
    if [ $TRIES -ge $MAXTRIES ]; then
        exit 1
    fi
    TRIES=$(($TRIES + 1))
    echo "Retrying npm install (Try $TRIES of $MAXTRIES)..."
done
rm npm-shrinkwrap.json
