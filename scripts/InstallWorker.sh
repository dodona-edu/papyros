publicDir="public"
if [ $# -gt 1 ]; then
    publicDir=$1
fi
serviceWorkerPath=$publicDir/inputServiceWorker.js
cp ../node_modules/@dodona/payros/inputServiceWorker.js $serviceWorkerPath
echo Installed default input service worker at $serviceWorkerPath
