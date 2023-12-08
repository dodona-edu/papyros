#!/bin/bash
rm -rf dist
bash ./scripts/setup.sh
webpack build --mode=$1
