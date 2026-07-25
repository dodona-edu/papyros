import { ProgrammingLanguage } from "../../src/ProgrammingLanguage";
import { BackendManager } from "../../src/communication/BackendManager";
// eslint-disable-next-line jest/no-mocks-import
import { MockBackend } from "../__mocks__/MockBackend";
import { BackendEvent, BackendEventType } from "../../src/communication/BackendEvent";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

function registerMock(language: ProgrammingLanguage): void {
    BackendManager.registerBackend(language, () => {
        return { workerProxy: new MockBackend() } as any;
    });
}

describe("BackendManager", () => {
    beforeEach(() => {
        registerMock(ProgrammingLanguage.JavaScript);
    });

    it("can register a backend", () => {
        expect(BackendManager.getBackend(ProgrammingLanguage.JavaScript)).toBeTruthy();
    });

    it("properly implements PubSub", async () => {
        const events: Array<BackendEvent> = [];
        const backend = BackendManager.getBackend(ProgrammingLanguage.JavaScript);
        const eventHandler = vi.fn((e: BackendEvent) => BackendManager.publish(e));
        const eventProcessor = vi.fn((e: BackendEvent) => events.push(e));
        BackendManager.subscribe(BackendEventType.Output, eventProcessor);
        await backend.workerProxy.launch(eventHandler);
        await backend.workerProxy.lintCode("");
        expect(eventHandler).toBeCalled();
        expect(eventProcessor).toBeCalled();
        expect(events.length).toEqual(1);
    });

    it("can remove a backend", () => {
        expect(BackendManager.removeBackend(ProgrammingLanguage.JavaScript)).toEqual(true);
    });
});

describe("BackendManager.setWorkerUrl", () => {
    let workerSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        (BackendManager as unknown as { workerUrls: Map<unknown, unknown> })["workerUrls"].clear();
        (BackendManager as unknown as { blobBootstrapUrls: Map<unknown, unknown> })["blobBootstrapUrls"].clear();
        workerSpy = vi.fn(function () {
            return { addEventListener: vi.fn(), removeEventListener: vi.fn(), postMessage: vi.fn() };
        });
        vi.stubGlobal("Worker", workerSpy);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("falls back to the default Worker when no URL is set for the language", () => {
        BackendManager.getBackend(ProgrammingLanguage.Python);
        expect(workerSpy).toBeCalled();

        const [bundledUrl] = workerSpy.mock.calls[0];
        expect((bundledUrl as URL).toString()).toContain("backend/workers/python/worker");
        expect((bundledUrl as URL).toString().startsWith("blob:")).toBe(false);
    });

    it("constructs the real Worker directly for a same-origin URL", () => {
        const sameOriginUrl = new URL("/same-origin-worker.js", window.location.href);
        BackendManager.setWorkerUrl(ProgrammingLanguage.Python, sameOriginUrl);
        BackendManager.getBackend(ProgrammingLanguage.Python);
        expect(workerSpy).toBeCalledWith(sameOriginUrl, { type: "module" });
    });

    it("bootstraps a cross-origin URL through a same-origin blob module", async () => {
        const crossOriginUrl = "https://cross-origin.example.com/worker.js";
        BackendManager.setWorkerUrl(ProgrammingLanguage.Python, crossOriginUrl);
        BackendManager.getBackend(ProgrammingLanguage.Python);
        expect(workerSpy).toBeCalledTimes(1);

        const [blobUrl, options] = workerSpy.mock.calls[0];
        expect(blobUrl).toMatch(/^blob:/);
        expect(options).toEqual({ type: "module" });

        const blobContent = await (await fetch(blobUrl as string)).text();
        expect(blobContent).toBe(`import ${JSON.stringify(crossOriginUrl)};`);
    });

    it("drops the cached client for the language so the next getBackend picks up the new URL", () => {
        const creator = vi.fn(() => ({ workerProxy: new MockBackend() }) as any);
        BackendManager.registerBackend(ProgrammingLanguage.JavaScript, creator);
        BackendManager.getBackend(ProgrammingLanguage.JavaScript);
        expect(creator).toBeCalledTimes(1);

        BackendManager.setWorkerUrl(ProgrammingLanguage.JavaScript, "https://cross-origin.example.com/worker.js");
        BackendManager.getBackend(ProgrammingLanguage.JavaScript);
        expect(creator).toBeCalledTimes(2);
    });
});
