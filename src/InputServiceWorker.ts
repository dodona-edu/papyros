/**
 * Default service worker to process user input using HTTP requests
 */
import { InputWorker } from "./workers/input/InputWorker";

// Impport service worker provided by the Papyros-package
let domain = location.href;
domain = domain.slice(0, domain.lastIndexOf("/")+1);
const inputHandler = new InputWorker(domain);

addEventListener("fetch", async function (event: FetchEvent) {
    if (!await inputHandler.handleInputRequest(event)) {
        event.respondWith(fetch(event.request));
    }
});
// Prevent needing to reload page to have working input
addEventListener("install", function (event: ExtendableEvent) {
    event.waitUntil(skipWaiting());
});
addEventListener("activate", function (event: ExtendableEvent) {
    event.waitUntil(clients.claim());
});

export { };
