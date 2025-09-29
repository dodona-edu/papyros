import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        outDir: 'public',       // output straight into public/
        emptyOutDir: false,     // don’t wipe public
        rollupOptions: {
            input: './src/communication/InputServiceWorker.ts',
            output: {
                entryFileNames: 'InputServiceWorker.js'
            }
        },
    },
});
