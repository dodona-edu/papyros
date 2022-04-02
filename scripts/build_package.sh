#!/bin/bash
# Expects to be run from the main directory
rm -rf dist
bash ./scripts/setup.sh
webpack build --mode production
