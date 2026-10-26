import { defineConfig } from "vite";
import browserslistToEsbuild from "browserslist-to-esbuild";

export default defineConfig({
    build: {
        target: browserslistToEsbuild(),
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
