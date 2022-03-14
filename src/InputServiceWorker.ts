/**
 * Default service worker to process user input using HTTP requests
 */
// Import service worker provided by the Papyros-package
import { InputWorker } from "./workers/input/InputWorker";

// Strip away the filename of the script to obtain the scope
let domain = location.href;
domain = domain.slice(0, domain.lastIndexOf("/")+1);
const inputHandler = new InputWorker(domain);

addEventListener("fetch", async function (event: FetchEvent) {
    if (!await inputHandler.handleInputRequest(event)) {
        // Not a Papyros-specific request
        // Fetch as we would handle a normal request
        return; // Default to nothing, browser will handle fetch itself
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
