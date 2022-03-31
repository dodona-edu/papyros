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

class Cacheable<T> {
    private cached: T | null;
    private createFn: () => T;
    constructor(createFn: () => T) {
        this.cached = null;
        this.createFn = createFn;
    }
    public get(): T {
        if (this.cached === null) {
            this.cached = this.createFn();
        }
        return this.cached;
    }
}

/**
 * Abstract class to implement the singleton pattern
 * Static methods group functionality
 */
export abstract class BackendManager {
    static createWorkerMap: Map<ProgrammingLanguage, Cacheable<SyncClient<Backend>>>
        = BackendManager.buildSyncClientMap();
    static channel: Channel = makeChannel()!;
    /**
     * Map an event type to interested subscribers
     * Uses an Array to maintain order of subscription
     */
    static subscriberMap: Map<BackendEventType, Array<BackendEventListener>> = new Map();

    private static buildSyncClientMap(): Map<ProgrammingLanguage, Cacheable<SyncClient<Backend>>> {
        const m = new Map();
        m.set(
            ProgrammingLanguage.Python, new Cacheable(
                () => new PyodideClient<Backend>(
                    () => new PythonWorker(),
                    BackendManager.channel
                )
            )
        );
        m.set(
            ProgrammingLanguage.JavaScript, new Cacheable(
                () => new SyncClient<Backend>(
                    () => new JavaScriptWorker(),
                    BackendManager.channel
                )
            )
        );
        return m;
    }
    /**
     * Start a backend for the given language, while storing the worker
     * @param {ProgrammingLanguage} language The programming language supported by the backend
     * @return {Remote<Backend>} A Comlink proxy for the Backend
     */
    static startBackend(language: ProgrammingLanguage): SyncClient<Backend> {
        if (this.createWorkerMap.has(language)) {
            return this.createWorkerMap.get(language)!.get();
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
}
