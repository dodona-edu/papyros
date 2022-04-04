import { Backend } from "./Backend";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import PythonWorker from "./workers/python/PythonWorker.worker";
import JavaScriptWorker from "./workers/javascript/JavaScriptWorker.worker";
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
    static subscriberMap: Map<BackendEventType, Array<BackendEventListener>>;
    /**
     * The channel used to communicate with the SyncClients
     */
    static channel: Channel;

    /**
     * @param {ProgrammingLanguage} language The language to support
     * @param {Function} backendCreator The constructor for a SyncClient
     */
    static registerBackend(language: ProgrammingLanguage,
        backendCreator: () => SyncClient<Backend>): void {
        BackendManager.createBackendMap.set(language, backendCreator);
        BackendManager.backendMap.delete(language);
    }

    /**
     * Start a backend for the given language and cache for reuse
     * @param {string} language The programming language supported by the backend
     * @return {SyncClient<Backend>} A SyncClient for the Backend
     */
    static startBackend(language: string): SyncClient<Backend> {
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
     * Register a callback for when an event of a certain type is published
     * @param {BackendEventType} type The type of event to subscribe to
     * @param {BackendEventListener} subscriber Callback for when an event
     * of the given type is published
     */
    static subscribe(type: BackendEventType, subscriber: BackendEventListener): void {
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
    static publish(e: BackendEvent): void {
        papyrosLog(LogType.Debug, "Publishing event: ", e);
        if (this.subscriberMap.has(e.type)) {
            this.subscriberMap.get(e.type)!.forEach(cb => cb(e));
        }
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
                () => new PythonWorker(),
                BackendManager.channel
            )
        );
        BackendManager.registerBackend(ProgrammingLanguage.JavaScript,
            () => new SyncClient<Backend>(
                () => new JavaScriptWorker(),
                BackendManager.channel
            )
        );
    }
}
