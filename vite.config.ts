import { defineConfig } from "vite";
import { playwright } from "@vitest/browser-playwright";
import browserslistToEsbuild from "browserslist-to-esbuild";

export default defineConfig({
    oxc: {
        supported: {
            "import-attributes": true,
            "import-assertions": true,
        },
    },
    build: {
        target: browserslistToEsbuild(),
    },
    worker: {
        format: "es",
    },
    // pyodide is only imported from the worker entry, which the dependency scan does not crawl.
    // Without this it is discovered once the first Python test starts a worker, and the reload
    // that follows restarts tests midway through a run.
    optimizeDeps: {
        include: ["pyodide"],
    },
    test: {
        browser: {
            enabled: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
            headless: true,
        },
        testTimeout: 100000, // loading pyodide can take a while
        sequence: {
            // Papyros instances are isolated now, but tests within a file still share
            // the page, its window mocks and the CPU that boots Pyodide
            concurrent: false,
        },
        maxWorkers: 4, // launching pyodide is CPU-bound, more workers do not help
    },
});
