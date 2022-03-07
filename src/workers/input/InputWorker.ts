import { serviceWorkerFetchListener } from "sync-message";

export class InputWorker {
    hostName: string;
    syncMessageListener = serviceWorkerFetchListener();

    constructor(hostName: string) {
        this.hostName = hostName;
    }

    async handleInputRequest(event: FetchEvent): Promise<boolean> {
        // Special requests targeted at getting input from the user
        if (this.syncMessageListener(event)) {
            return true;
        }

        const url = event.request.url;
        if (url.includes(this.hostName)) { // requests to our own domain
            const promiseChain = fetch(event.request)
                .then(response => {
                    // Add new headers to be able to use SharedArrayBuffers
                    // if the browser supports them
                    // eslint-disable-next-line max-len
                    // See also https://stackoverflow.com/questions/64650119/react-error-sharedarraybuffer-is-not-defined-in-firefox
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
                });
            event.respondWith(promiseChain);
            return true;
        } else {
            return false;
        }
    }
}
