d=$(pwd)
rm -rf dist
source ./scripts/setup.sh
webpack build --mode production

