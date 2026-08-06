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
    test: {
        browser: {
            enabled: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
            headless: true,
        },
        testTimeout: 100000, // loading pyodide can take a while
        sequence: {
            // tests within a file share the static BackendManager, so they cannot overlap
            concurrent: false,
        },
        maxWorkers: 4, // launching pyodide is CPU-bound, more workers do not help
    },
});
