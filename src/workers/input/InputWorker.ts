import { INPUT_RELATIVE_URL } from "../../Constants";

function sleep(ms: number): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export class InputWorker {
    hostName: string;
    suffix: string;
    input: string;

    constructor(hostName: string, suffix = INPUT_RELATIVE_URL) {
        this.hostName = hostName;
        this.suffix = suffix;
        this.input = "";
    }


    async waitForInput(): Promise<Response> {
        while (!this.input) {
            await sleep(1000);
        }
        const ret = Promise.resolve(new Response(this.input));
        this.input = ""; // consume current input
        return ret;
    }

    async handleInputRequest(event: FetchEvent): Promise<boolean> {
        const url = event.request.url;
        if (url.includes(this.suffix)) { // Special requests targeted at getting input from the user
            const method = event.request.method;
            if (method === "GET") { // Request from the worker to receive input
                event.respondWith(this.waitForInput());
            } else if (method === "POST") { // Request from Papyros to send input
                event.respondWith(event.request.json().then(resp => {
                    this.input = resp.input;
                    return new Response("input stored: " + this.input);
                }));
            } else {
                event.respondWith(
                    Promise.reject(new Error(`Unsupported method ${method} for ${this.suffix}`))
                );
            }
            return true;
        } else if (url.includes(this.hostName)) {
            event.respondWith(fetch(event.request)
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
                }));
            return true;
        } else {
            return false;
        }
    }
}
