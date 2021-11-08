// Listen to fetch 
console.log("Loading service worker");
self.input = "";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForInput(){
    if(self.input){
        console.log("Input present, responding with: " + self.input);
        const ret =  Promise.resolve(new Response(self.input));
        self.input = "";
        return ret;
    } else {
        console.log("Sleeping while waiting for input");
        await sleep(1000);
        console.log("Sleeping done");
        return waitForInput();
    }
}

self.addEventListener('fetch', function(event) {
    console.log("Fetch event occurred in service worker for url: " + event.request.url);
    if(event.request.url.includes("input")){
        console.log("Got fetch for input!", event);
        console.log("Current input is: ", self.input);
        let promiseChain;
        if(event.request.method === "GET"){
            console.log("Handling GET request");
            promiseChain = waitForInput();
        } else if(event.request.method === "POST"){
            console.log("Handling POST request");
            console.log(event.request);
            promiseChain = event.request.json().then(resp => {
                self.input = resp.input;
                return new Response("input stored: " + self.input);
            })
        }
        event.respondWith(promiseChain);
    } else {
        return fetch(event);
    }
});