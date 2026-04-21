import { defineConfig } from "vite";

export default defineConfig({
    build: {
        outDir: "public",
        emptyOutDir: false,
        rolldownOptions: {
            input: "./src/communication/InputServiceWorker.ts",
            output: {
                entryFileNames: "InputServiceWorker.js",
            },
        },
    },
});
