#!/bin/bash
# Expects to be run from the main directory
BASE_PYTHON_DIR=src/workers/python
PACKAGE_NAME=python_package
OUT_DIR=$BASE_PYTHON_DIR/$PACKAGE_NAME
SRC_DIR=$BASE_PYTHON_DIR/papyros

set -eux
rm -rf $OUT_DIR $OUT_DIR.tar.load_by_url
mkdir $OUT_DIR
pip install -t $OUT_DIR python-runner friendly_traceback jedi
cp -r $SRC_DIR $OUT_DIR
cd $OUT_DIR
tar cf ../$PACKAGE_NAME.tar.load_by_url *
