/* eslint-disable no-restricted-globals */
const workerData = {
    "input": ""
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForInput(){
    if(workerData.input){
        const ret =  Promise.resolve(new Response(workerData.input));
        workerData.input = "";
        return ret;
    } else {
        await sleep(1000);
        return waitForInput();
    }
}

addEventListener('fetch', function(event) {
    const url = event.request.url.toLowerCase();
    console.log("Fetch event to url: ", url);
    let promiseChain;
    if(url.includes(location.hostname.toLowerCase())){
        if(url.includes("input")){
            if(event.request.method === "GET"){
                promiseChain = waitForInput();
            } else if(event.request.method === "POST"){
                promiseChain = event.request.json().then(resp => {
                    workerData.input = resp.input;
                    return new Response("input stored: " + workerData.input);
                })
            }
        } else {
            promiseChain = fetch(event.request)
                .then((response) => {
                // Add new headers to be able to use SharedArrayBuffers if the browser supports them
                // See also https://stackoverflow.com/questions/64650119/react-error-sharedarraybuffer-is-not-defined-in-firefox
                const newHeaders = new Headers(response.headers);
                newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
                newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
        
                const moddedResponse = new Response(response.body, {
                    status: response.status || 200,
                    statusText: response.statusText,
                    headers: newHeaders,
                });
        
                return moddedResponse;

                })
            }
    } else {
        promiseChain = fetch(event.request);
    }
    event.respondWith(promiseChain);
});