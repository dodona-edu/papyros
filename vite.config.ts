import { defineConfig } from 'vite';

export default defineConfig({
    esbuild: {
        supported: {
            'import-attributes': true,
            'import-assertions': true
        }
    },
    worker: {
        format: "es"
    },
    test: {
        browser: {
            enabled: true,
            provider: 'playwright',
            instances: [{browser: 'chromium',},],
            headless: true,
        },
    },
});
