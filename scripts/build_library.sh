#!/bin/bash
rm -rf dist
cd src/workers/python
python3 build_package.py
cd -
tsc
cp src/workers/python/python_package.tar.gz.load_by_url dist/workers/python
npx tailwindcss -i ./src/Papyros.css -o ./dist/Papyros.css