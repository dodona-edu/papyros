import { Backend } from "./Backend";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import { BackendEvent, BackendEventType } from "./BackendEvent";
import { LogType, papyrosLog } from "./util/Logging";
import { Channel, makeChannel } from "sync-message";
import { SyncClient } from "comsync";
import { PyodideClient } from "pyodide-worker-runner";
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
     */
    public static channel: Channel;

    /**
     * @param {ProgrammingLanguage} language The language to support
     * @param {Function} backendCreator The constructor for a SyncClient
     */
    public static registerBackend(language: ProgrammingLanguage,
        backendCreator: () => SyncClient<Backend>): void {
        BackendManager.removeBackend(language);
        BackendManager.createBackendMap.set(language, backendCreator);
    }

    /**
     * Start a backend for the given language and cache for reuse
     * @param {ProgrammingLanguage} language The programming language supported by the backend
     * @return {SyncClient<Backend>} A SyncClient for the Backend
     */
    public static getBackend(language: ProgrammingLanguage): SyncClient<Backend> {
        if (this.backendMap.has(language)) { // Cached
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
     * @param {BackendEventType} e The event to publish
     */
    public static publish(e: BackendEvent): void {
        papyrosLog(LogType.Debug, "Publishing event: ", e);
        if (e.type === BackendEventType.Start) {
            BackendManager.halted = false;
        }
        if ((!BackendManager.halted || e.type === BackendEventType.FrameChange) && this.subscriberMap.has(e.type)) {
            this.subscriberMap.get(e.type)!.forEach(cb => cb(e));
        }
    }

    private static halt(): void {
        BackendManager.halted = true;
    }

    /**
     * Initialise the fields and setup the maps
     */
    static {
        BackendManager.channel = makeChannel()!;
        BackendManager.createBackendMap = new Map();
        BackendManager.backendMap = new Map();
        BackendManager.subscriberMap = new Map();
        BackendManager.registerBackend(ProgrammingLanguage.Python,
            () => new PyodideClient<Backend>(
                () => new Worker(new URL("./workers/python/worker", import.meta.url), {
                    type: 'module',
                }),
                BackendManager.channel
            )
        );
        BackendManager.registerBackend(ProgrammingLanguage.JavaScript,
            () => new SyncClient<Backend>(
                () => new Worker(new URL("./workers/javascript/worker", import.meta.url), {
                    type: 'module',
                }),
                BackendManager.channel
            )
        );
        BackendManager.halted = false;
        BackendManager.subscribe(BackendEventType.End, () => BackendManager.halt());
        BackendManager.subscribe(BackendEventType.Interrupt, () => BackendManager.halt());
    }
}
