import { describe, expect, it } from "vitest";
import {
    isServiceWorkerRequest,
    makeChannel,
    makeServiceWorkerChannel,
    readMessage,
    serviceWorkerFetchListener,
} from "../../../src/sync/channel";

/**
 * The wire protocol below is frozen on purpose. A freshly deployed Papyros must keep working
 * with a service worker that an earlier deploy already registered in the browser, so the URL
 * suffix and the version string may not change without a migration path.
 */
const BASE_URL_SUFFIX = "__SyncMessageServiceWorkerInput__";
const VERSION = "__sync-message-v2__";

type Responder = (e: any) => boolean;

function fakeEvent(url: string, body: unknown = {}): { event: any; response: Promise<Response> } {
    let resolveResponse: (r: Response | Promise<Response>) => void;
    const response = new Promise<Response>((resolve) => {
        resolveResponse = resolve;
    });
    const event = {
        request: { url, json: async () => body },
        respondWith: (r: Response | Promise<Response>) => resolveResponse(r),
    };
    return { event, response };
}

function read(listener: Responder, messageId: string, timeout = 50): Promise<Response> {
    const { event, response } = fakeEvent(`/${BASE_URL_SUFFIX}/read`, { messageId, timeout });
    listener(event);
    return response;
}

function write(listener: Responder, messageId: string, message: unknown): Promise<Response> {
    const { event, response } = fakeEvent(`/${BASE_URL_SUFFIX}/write`, { messageId, message });
    listener(event);
    return response;
}

describe("isServiceWorkerRequest", () => {
    it("recognises a sync-message url and ignores others", () => {
        expect(isServiceWorkerRequest(`/${BASE_URL_SUFFIX}/read`)).toBe(true);
        expect(isServiceWorkerRequest("/assets/app.js")).toBe(false);
    });

    it("accepts a fetch event as well as a string", () => {
        const event = { request: { url: `/${BASE_URL_SUFFIX}/write` } } as any;
        expect(isServiceWorkerRequest(event)).toBe(true);
    });
});

describe("channel construction", () => {
    it("falls back to a service worker channel when SharedArrayBuffer is unavailable", () => {
        // The test page is not cross-origin isolated, so this is the path Dodona runs in production
        expect(typeof SharedArrayBuffer).toBe("undefined");
        expect(makeChannel()).toMatchObject({ type: "serviceWorker", baseUrl: `/${BASE_URL_SUFFIX}` });
    });

    it("honours a custom scope and timeout", () => {
        const channel = makeServiceWorkerChannel({ scope: "/papyros/", timeout: 1234 });
        expect(channel).toEqual({
            type: "serviceWorker",
            baseUrl: `/papyros/${BASE_URL_SUFFIX}`,
            timeout: 1234,
        });
    });
});

describe("serviceWorkerFetchListener", () => {
    it("leaves unrelated requests alone", () => {
        expect(serviceWorkerFetchListener()(fakeEvent("/assets/app.js").event)).toBe(false);
    });

    it("reports the frozen protocol version", async () => {
        const { event, response } = fakeEvent(`/${BASE_URL_SUFFIX}/version`);
        expect(serviceWorkerFetchListener()(event)).toBe(true);
        expect(await (await response).text()).toBe(VERSION);
    });

    it("delivers a message written before the read", async () => {
        const listener = serviceWorkerFetchListener();
        await write(listener, "id-1", "written first");
        const body = await (await read(listener, "id-1")).json();
        expect(body).toEqual({ message: "written first", version: VERSION });
    });

    it("delivers a message written while the read is pending", async () => {
        const listener = serviceWorkerFetchListener();
        const pending = read(listener, "id-2", 5000);
        await write(listener, "id-2", "written second");
        const body = await (await pending).json();
        expect(body).toEqual({ message: "written second", version: VERSION });
    });

    it("times out a read with status 408", async () => {
        const listener = serviceWorkerFetchListener();
        expect((await read(listener, "id-3", 10)).status).toBe(408);
    });
});

describe("readMessage", () => {
    it("gives up and returns null once the total timeout elapses", () => {
        const channel = makeServiceWorkerChannel();
        // No service worker is controlling this page, so every check fails and the deadline is hit
        expect(readMessage(channel, "never-answered", { timeout: 20, checkTimeout: 5 })).toBeNull();
    });
});
