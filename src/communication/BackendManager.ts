import { Backend } from "../backend/Backend";
import { ProgrammingLanguage } from "../ProgrammingLanguage";
import { BackendEvent, BackendEventType } from "./BackendEvent";
import { Channel } from "../sync/channel";
import { SyncClient } from "../sync/SyncClient";
/**
 * Callback type definition for subscribers
 * @param {BackendEvent} e The published event
 */
type BackendEventListener = (e: BackendEvent) => void;

/**
 * Abstract class to implement the singleton pattern
 * Static methods group functionality
 */
export abstract class BackendManager {
    /**
     * Map programming languages to Backend constructors
     */
    private static createBackendMap: Map<ProgrammingLanguage, () => SyncClient<Backend>>;
    /**
     * Map to cache Backends per ProgrammingLanguage
     */
    private static backendMap: Map<ProgrammingLanguage, SyncClient<Backend>>;
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
     * Map an event type to interested subscribers
     * Uses an Array to maintain order of subscription
     */
    private static subscriberMap: Map<BackendEventType, Array<BackendEventListener>>;
    /**
     * Whether the BackendManager is publishing events
     */
    private static halted: boolean;
    /**
     * The channel used to communicate with the SyncClients
     * Assigned by Papyros once a backend turns out to need one
     */
    public static channel: Channel | null = null;

    /**
     * @param {ProgrammingLanguage} language The language to support
     * @param {Function} backendCreator The constructor for a SyncClient
     */
    public static registerBackend(language: ProgrammingLanguage, backendCreator: () => SyncClient<Backend>): void {
        BackendManager.removeBackend(language);
        BackendManager.createBackendMap.set(language, backendCreator);
    }

    /**
     * Override where the Worker script for a language's backend is loaded from, e.g. so a
     * page served from a sibling/canonical asset host can point at that host's copy of the
     * worker chunk instead of the page's own origin
     * Call this before launching the backend for the language: like removeBackend, replacing
     * the URL after a backend was already created only drops the cached client for that
     * language, it does not terminate the client's already-running Worker
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
        BackendManager.backendMap.delete(language);
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
     * Start a backend for the given language and cache for reuse
     * @param {ProgrammingLanguage} language The programming language supported by the backend
     * @return {SyncClient<Backend>} A SyncClient for the Backend
     */
    public static getBackend(language: ProgrammingLanguage): SyncClient<Backend> {
        if (this.backendMap.has(language)) {
            // Cached
            return this.backendMap.get(language)!;
        } else if (this.createBackendMap.has(language)) {
            // Create and then cache
            const syncClient = this.createBackendMap.get(language)!();
            this.backendMap.set(language, syncClient);
            return syncClient;
        } else {
            throw new Error(`${language} is not yet supported.`);
        }
    }

    /**
     * Remove a backend for the given language
     * @param {ProgrammingLanguage} language The programming language supported by the backend
     * @return {boolean} Whether the remove operation had any effect
     */
    public static removeBackend(language: ProgrammingLanguage): boolean {
        this.backendMap.delete(language);
        return this.createBackendMap.delete(language);
    }

    /**
     * Register a callback for when an event of a certain type is published
     * @param {BackendEventType} type The type of event to subscribe to
     * @param {BackendEventListener} subscriber Callback for when an event
     * of the given type is published
     */
    public static subscribe(type: BackendEventType, subscriber: BackendEventListener): void {
        if (!this.subscriberMap.has(type)) {
            this.subscriberMap.set(type, []);
        }
        const subscribers = this.subscriberMap.get(type)!;
        if (!subscribers.includes(subscriber)) {
            subscribers.push(subscriber);
        }
    }

    /**
     * Publish an event, notifying all listeners for its type
     * @param {BackendEvent} e The event to publish
     */
    public static publish(e: BackendEvent): void {
        if (e.type === BackendEventType.Start) {
            BackendManager.halted = false;
        }
        if (
            (!BackendManager.halted || e.type === BackendEventType.FrameChange || e.type === BackendEventType.Files) &&
            this.subscriberMap.has(e.type)
        ) {
            this.subscriberMap.get(e.type)!.forEach((cb) => cb(e));
        }
    }

    private static halt(): void {
        BackendManager.halted = true;
    }

    /**
     * Initialise the fields and setup the maps
     */
    static {
        BackendManager.createBackendMap = new Map();
        BackendManager.backendMap = new Map();
        BackendManager.subscriberMap = new Map();
        BackendManager.registerBackend(
            ProgrammingLanguage.Python,
            () =>
                new SyncClient<Backend>(
                    () =>
                        BackendManager.workerFor(
                            ProgrammingLanguage.Python,
                            // Bundlers detect this exact `new Worker(new URL(...), ...)` expression to
                            // emit the worker chunk, so the URL and options must stay inlined, not extracted
                            () =>
                                new Worker(new URL("../backend/workers/python/worker", import.meta.url), {
                                    type: "module",
                                }),
                        ),
                    BackendManager.channel,
                ),
        );
        BackendManager.registerBackend(
            ProgrammingLanguage.JavaScript,
            () =>
                new SyncClient<Backend>(
                    () =>
                        BackendManager.workerFor(
                            ProgrammingLanguage.JavaScript,
                            // Bundlers detect this exact `new Worker(new URL(...), ...)` expression to
                            // emit the worker chunk, so the URL and options must stay inlined, not extracted
                            () =>
                                new Worker(new URL("../backend/workers/javascript/worker", import.meta.url), {
                                    type: "module",
                                }),
                        ),
                    BackendManager.channel,
                ),
        );
        BackendManager.halted = false;
        BackendManager.subscribe(BackendEventType.End, () => BackendManager.halt());
        BackendManager.subscribe(BackendEventType.Interrupt, () => BackendManager.halt());
    }
}
