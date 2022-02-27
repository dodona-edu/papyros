/**
 * Default service worker to process user input using HTTP requests
 */
import { InputWorker } from "./workers/input/InputWorker";

const papyrosHost = location.host;
const inputHandler = new InputWorker(papyrosHost);

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
