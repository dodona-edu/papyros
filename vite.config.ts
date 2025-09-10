import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        // Generate sourcemaps for debugging
        sourcemap: true,
        rollupOptions: {
            // Define entry points (matches your Webpack config)
            input: {
                app: './src/App.ts',
                inputServiceWorker: './src/InputServiceWorker.ts',
            },
            // Output format and global variable name
            output: {
                entryFileNames: '[name].js',
                // format: 'umd',
                name: 'Papyros',
                inlineDynamicImports: false
            },
        },
    },
    // Development server settings
    server: {
        port: 8080,
    },
    // Resolve TypeScript and JavaScript files
    resolve: {
        extensions: ['.ts', '.js'],
    },
    worker: {
        format: "es"
    }
});
