import { defineConfig } from "vite";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
    esbuild: {
        supported: {
            "import-attributes": true,
            "import-assertions": true,
        },
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
            concurrent: false, // disable running tests in parallel
        },
        fileParallelism: false, // disable running tests in parallel
    },
});
