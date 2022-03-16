import { serviceWorkerFetchListener } from "sync-message";

/**
 * Class that is used in a service worker to allow synchronous communication
 * between threads. This is achieved in two different ways.
 * Responses can be modified by attaching headers allowing the use of shared memory.
 * Requests to certain endpoints can be used with synchronous requests
 * to achieve the same goal.
 */
export class InputWorker {
    // Host domain that is safe to be altered
    private hostName: string;
    // Listener for special fetch events
    private syncMessageListener: (e: FetchEvent) => boolean;

    /**
     * Create a worker for a specific domain
     * @param {string} hostName Optional name of the host domain
     */
    constructor(hostName = "") {
        this.hostName = hostName;
        this.syncMessageListener = serviceWorkerFetchListener();
    }

    /**
     * Process and potentially handle a fetch request from the application
     * @param {FetchEvent} event The event denoting a request to a url
     * @return {boolean} Whether the event was handled
     */
    async handleInputRequest(event: FetchEvent): Promise<boolean> {
        // Special requests targeted at getting input from the user
        if (this.syncMessageListener(event)) {
            return true;
        }
        const url = event.request.url;
        if (this.hostName && url.includes(this.hostName)) { // requests to our own domain
            event.respondWith(
                fetch(event.request)
                    .then(response => {
                        // Add new headers to be able to use SharedArrayBuffers
                        // if the browser supports them
                        const newHeaders = new Headers(response.headers);
                        newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
                        newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
                        newHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");

                        const moddedResponse = new Response(response.body, {
                            status: response.status || 200,
                            statusText: response.statusText,
                            headers: newHeaders,
                        });
                        return moddedResponse;
                    }));
            return true;
        } else {
            return false;
        }
    }
}
