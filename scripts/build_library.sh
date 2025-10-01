#!/bin/bash

# clean directory
rm -rf dist

# build python package
cd src/backend/workers/python
python3 build_package.py
cd -

# compile typescript
tsc

# build service worker
yarn build:sw
cp public/InputServiceWorker.js dist/InputServiceWorker.js

# copy compiled python package to dist
cp src/backend/workers/python/python_package.tar.gz.load_by_url dist/backend/workers/python