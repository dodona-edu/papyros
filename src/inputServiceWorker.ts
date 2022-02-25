/**
 * Default service worker to process user input using HTTP requests
 */
import { DEFAULT_SERVICE_WORKER } from "./Constants";
import { InputHandler } from "./workers/input/InputWorker";

const papyrosHost = location.href.replace(DEFAULT_SERVICE_WORKER, "");
const inputHandler = new InputHandler(papyrosHost);

addEventListener("fetch", async function (event: FetchEvent) {
    if (!await inputHandler.handleInputRequest(event)) {
        event.respondWith(fetch(event.request));
    }
});
// Prevent needing to reload page to have working input
addEventListener("install", function (event: ExtendableEvent) {
    event.waitUntil(skipWaiting());
});
addEventListener("activate", function (event) {
    event.waitUntil(clients.claim());
});

export { };
