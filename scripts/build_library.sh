#!/bin/bash
rm -rf dist
cd src/workers/python
python3 build_package.py
cd -
tsc
mv src/workers/python/python_package.tar.gz dist/workers/python
npx tailwindcss -i ./src/Papyros.css -o ./dist/Papyros.css