import { Backend } from "../backend/Backend";
import { ProgrammingLanguage } from "../ProgrammingLanguage";
import { SyncClient } from "../sync/SyncClient";

/**
 * Static registry mapping programming languages to backend worker factories.
 *
 * Only configuration lives here: the clients themselves are created per Papyros
 * instance and owned by its Runner, so instances never share a worker.
 */
export abstract class BackendManager {
    /**
     * Map programming languages to Backend constructors
     */
    private static createBackendMap: Map<ProgrammingLanguage, () => SyncClient<Backend>> = new Map();
    /**
     * Map programming languages to overridden Worker script URLs, consulted by the
     * default backendCreators registered in the static initializer
     */
    private static workerUrls: Map<ProgrammingLanguage, URL> = new Map();
    /**
     * Map a Worker script URL's href to a cached same-origin blob bootstrap URL, used when
     * the URL is cross-origin
     */
    private static blobBootstrapUrls: Map<string, string> = new Map();

    /**
     * @param {ProgrammingLanguage} language The language to support
     * @param {Function} backendCreator The constructor for a SyncClient
     */
    public static registerBackend(language: ProgrammingLanguage, backendCreator: () => SyncClient<Backend>): void {
        BackendManager.createBackendMap.set(language, backendCreator);
    }

    /**
     * Override where the Worker script for a language's backend is loaded from, e.g. so a
     * page served from a sibling/canonical asset host can point at that host's copy of the
     * worker chunk instead of the page's own origin
     * Call this before launching the backend for the language: a backend that is already
     * running keeps the Worker it was created with
     * If url is cross-origin relative to the page, papyros bootstraps the Worker through a
     * same-origin blob module that imports the real url: the browser requires the initial
     * Worker construction to be same-origin, and a blob: URL inherits the page's origin so it
     * satisfies that, after which the import inside it fetches the real worker chunk via CORS,
     * so the asset host serving url must send CORS headers allowing that import
     * The embedding page's Content Security Policy must also allow blob: plus the worker
     * chunk's origin in worker-src (and child-src for older Safari), since Chromium checks a
     * module worker's imports against worker-src rather than script-src
     * @param {ProgrammingLanguage} language The language whose Worker script location to override
     * @param {string | URL} url The URL to load the language's backend Worker script from
     */
    public static setWorkerUrl(language: ProgrammingLanguage, url: string | URL): void {
        BackendManager.workerUrls.set(language, new URL(url, window.location.href));
    }

    /**
     * Pick the Worker for a language: the overridden url's Worker if one was set via
     * setWorkerUrl, otherwise the bundled Worker
     * @param {ProgrammingLanguage} language The language whose Worker to construct
     * @param {Function} bundledWorker Constructs the bundled Worker for the language
     * @return {Worker} The constructed Worker
     */
    private static workerFor(language: ProgrammingLanguage, bundledWorker: () => Worker): Worker {
        const url = BackendManager.workerUrls.get(language);
        return url ? BackendManager.createWorker(url) : bundledWorker();
    }

    /**
     * Construct the Worker for an overridden url, bootstrapping through a same-origin blob
     * module when url is cross-origin
     * @param {URL} url The overridden Worker script URL
     * @return {Worker} The constructed Worker
     */
    private static createWorker(url: URL): Worker {
        if (url.origin === window.location.origin) {
            return new Worker(url, { type: "module" });
        }
        let bootstrapUrl = BackendManager.blobBootstrapUrls.get(url.href);
        if (!bootstrapUrl) {
            // The initial Worker construction must be same-origin; a blob: URL inherits the
            // page's origin so it satisfies that, while the import inside it fetches the real
            // cross-origin worker chunk, which is why that chunk needs CORS headers enabled
            bootstrapUrl = URL.createObjectURL(
                new Blob([`import ${JSON.stringify(url.href)};`], { type: "text/javascript" }),
            );
            BackendManager.blobBootstrapUrls.set(url.href, bootstrapUrl);
        }
        return new Worker(bootstrapUrl, { type: "module" });
    }

    /**
     * Create a fresh backend client for the given language
     * @param {ProgrammingLanguage} language The programming language supported by the backend
     * @return {SyncClient<Backend>} A SyncClient for the Backend
     */
    public static createBackend(language: ProgrammingLanguage): SyncClient<Backend> {
        const creator = this.createBackendMap.get(language);
        if (!creator) {
            throw new Error(`${language} is not yet supported.`);
        }
        return creator();
    }

    /**
     * Remove a backend for the given language
     * @param {ProgrammingLanguage} language The programming language supported by the backend
     * @return {boolean} Whether the remove operation had any effect
     */
    public static removeBackend(language: ProgrammingLanguage): boolean {
        return this.createBackendMap.delete(language);
    }

    static {
        BackendManager.registerBackend(
            ProgrammingLanguage.Python,
            () =>
                new SyncClient<Backend>(() =>
                    BackendManager.workerFor(
                        ProgrammingLanguage.Python,
                        // Bundlers detect this exact `new Worker(new URL(...), ...)` expression to
                        // emit the worker chunk, so the URL and options must stay inlined, not extracted
                        () =>
                            new Worker(new URL("../backend/workers/python/worker", import.meta.url), {
                                type: "module",
                            }),
                    ),
                ),
        );
        BackendManager.registerBackend(
            ProgrammingLanguage.JavaScript,
            () =>
                new SyncClient<Backend>(() =>
                    BackendManager.workerFor(
                        ProgrammingLanguage.JavaScript,
                        // Bundlers detect this exact `new Worker(new URL(...), ...)` expression to
                        // emit the worker chunk, so the URL and options must stay inlined, not extracted
                        () =>
                            new Worker(new URL("../backend/workers/javascript/worker", import.meta.url), {
                                type: "module",
                            }),
                    ),
                ),
        );
    }
}
