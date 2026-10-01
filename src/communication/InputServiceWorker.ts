/**
 * Default service worker to process user input using HTTP requests
 */
// Import service worker provided by the Papyros-package
import { CLAIM_CLIENTS_MESSAGE, InputWorker } from "./InputWorker";

// Strip away the filename of the script to obtain the scope
// let domain = location.href;
// domain = domain.slice(0, domain.lastIndexOf("/") + 1);
const domain = ""; // Disable SharedArrayBuffers to use same environment as Dodona
const inputHandler = new InputWorker(domain);

addEventListener("fetch", async function (event: FetchEvent) {
    if (!(await inputHandler.handleInputRequest(event))) {
        // Not a Papyros-specific request
        // Fetch as we would handle a normal request
        // Default action is to let browser handle it by not responding here
        return;
    }
});
// Prevent needing to reload page to have working input
addEventListener("install", function (event: ExtendableEvent) {
    event.waitUntil(skipWaiting());
});
addEventListener("activate", function (event: ExtendableEvent) {
    event.waitUntil(clients.claim());
});
// A hard reload bypasses the service worker, and the page stays uncontrolled until it is claimed
addEventListener("message", function (event: ExtendableMessageEvent) {
    if (event.data === CLAIM_CLIENTS_MESSAGE) {
        event.waitUntil(clients.claim());
    }
});

export {};
