#!/bin/bash
# Expects to be run from the main directory
rm -rf dist
bash ./scripts/setup.sh
mkdir dist && mkdir dist/workers && mkdir dist/workers/python
mv src/workers/python/python_package.tar.gz.load_by_url dist/workers/python/python_package.tar.gz.load_by_url
webpack build --mode=$1
rm dist/workers/python/python_package.tar.gz.load_by_url
