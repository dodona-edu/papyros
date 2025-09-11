#!/bin/bash

# clean directory
rm -rf dist

# build python package
cd src/workers/python
python3 build_package.py
cd -

# compile typescript
tsc

# build service worker
yarn build:sw
cp public/InputServiceWorker.js dist/InputServiceWorker.js

# copy compiled python package to dist
cp src/workers/python/python_package.tar.gz.load_by_url dist/workers/python

# build tailwind css
npx tailwindcss -i ./src/Papyros.css -o ./dist/Papyros.css