#!/bin/bash

set -eux

rm -rf ./package ./package.tar
mkdir ./package
pip install -t ./package python-runner friendly_traceback jedi
cp -r ./papyros ./package
cd ./package
tar cfv ./../package.tar *
