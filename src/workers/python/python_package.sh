#!/bin/bash
OUT_DIR=./python_package
SRC_DIR=./papyros
set -eux

rm -rf $OUT_DIR $OUT_DIR.tar.load_by_url
mkdir $OUT_DIR
pip install -t $OUT_DIR python-runner friendly_traceback jedi
cp -r $SRC_DIR $OUT_DIR
cd $OUT_DIR
tar cfv ./.$OUT_DIR.tar.load_by_url *
