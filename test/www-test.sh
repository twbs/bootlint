#!/bin/bash
../bin/www &
sleep 5
curl -H "Content-Type: text/html; charset=UTF-8" -H "Accept: application/json" --data-binary @./fixtures/grid/cols-redundant.html  http://localhost:7070/
kill -15 %1
