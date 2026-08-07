import { ProgrammingLanguage } from "../../src/ProgrammingLanguage";
import { BackendManager } from "../../src/communication/BackendManager";
// eslint-disable-next-line jest/no-mocks-import
import { MockBackend } from "../__mocks__/MockBackend";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

describe("BackendManager", () => {
    it("can register a backend", () => {
        BackendManager.registerBackend(ProgrammingLanguage.JavaScript, () => {
            return { workerProxy: new MockBackend() } as any;
        });
        expect(BackendManager.createBackend(ProgrammingLanguage.JavaScript)).toBeTruthy();
    });

    it("creates a fresh client per call", () => {
        BackendManager.registerBackend(ProgrammingLanguage.JavaScript, () => {
            return { workerProxy: new MockBackend() } as any;
        });
        const first = BackendManager.createBackend(ProgrammingLanguage.JavaScript);
        const second = BackendManager.createBackend(ProgrammingLanguage.JavaScript);
        expect(first).not.toBe(second);
    });

    it("can remove a backend", () => {
        BackendManager.registerBackend(ProgrammingLanguage.JavaScript, () => {
            return { workerProxy: new MockBackend() } as any;
        });
        expect(BackendManager.removeBackend(ProgrammingLanguage.JavaScript)).toEqual(true);
        expect(() => BackendManager.createBackend(ProgrammingLanguage.JavaScript)).toThrow("not yet supported");
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
        BackendManager.createBackend(ProgrammingLanguage.Python);
        expect(workerSpy).toBeCalled();

        const [bundledUrl] = workerSpy.mock.calls[0];
        expect((bundledUrl as URL).toString()).toContain("backend/workers/python/worker");
        expect((bundledUrl as URL).toString().startsWith("blob:")).toBe(false);
    });

    it("constructs the real Worker directly for a same-origin URL", () => {
        const sameOriginUrl = new URL("/same-origin-worker.js", window.location.href);
        BackendManager.setWorkerUrl(ProgrammingLanguage.Python, sameOriginUrl);
        BackendManager.createBackend(ProgrammingLanguage.Python);
        expect(workerSpy).toBeCalledWith(sameOriginUrl, { type: "module" });
    });

    it("bootstraps a cross-origin URL through a same-origin blob module", async () => {
        const crossOriginUrl = "https://cross-origin.example.com/worker.js";
        BackendManager.setWorkerUrl(ProgrammingLanguage.Python, crossOriginUrl);
        BackendManager.createBackend(ProgrammingLanguage.Python);
        expect(workerSpy).toBeCalledTimes(1);

        const [blobUrl, options] = workerSpy.mock.calls[0];
        expect(blobUrl).toMatch(/^blob:/);
        expect(options).toEqual({ type: "module" });

        const blobContent = await (await fetch(blobUrl as string)).text();
        expect(blobContent).toBe(`import ${JSON.stringify(crossOriginUrl)};`);
    });
});
