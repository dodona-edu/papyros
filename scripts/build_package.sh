d=$(pwd)
rm -rf dist
webpack build --mode production
source ./scripts/setup.sh
cd $d
cp src/workers/python/package.tar dist/workers/python/

