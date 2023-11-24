#!/bin/bash
cd src/workers/python
python3 build_package.py
mv ./python_package.tar.gz ../../dist/python_package.tar.gz