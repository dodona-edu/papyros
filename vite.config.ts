import { defineConfig } from 'vite';

export default defineConfig({
    // Development server settings
    server: {
        headers: {
            'Service-Worker-Allowed': '/',
        },
    },
    worker: {
        format: "es"
    }
});
