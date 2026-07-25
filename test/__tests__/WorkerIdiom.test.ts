import { describe, expect, it } from "vitest";
import backendManagerSource from "../../src/communication/BackendManager.ts?raw";

// Host bundlers statically detect the exact `new Worker(new URL("...", import.meta.url),
// { type: "module" })` expression to emit the worker chunk. Refactoring it away (extracting
// the URL, sharing a helper) breaks consumers' builds silently: dev and tests serve modules
// unbundled, so the failure only appears as a 404 worker in a production build.
function workerIdiom(path: string): RegExp {
    const escaped = RegExp.escape(path);
    return new RegExp(`new Worker\\(new URL\\("${escaped}", import\\.meta\\.url\\), \\{\\s*type: "module",?\\s*\\}\\)`);
}

describe("worker chunk idiom", () => {
    it.each(["../backend/workers/python/worker", "../backend/workers/javascript/worker"])(
        "keeps the literal new Worker(new URL(...)) expression for %s",
        (path) => {
            expect(backendManagerSource).toMatch(workerIdiom(path));
        },
    );
});
