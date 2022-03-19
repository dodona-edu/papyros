/* eslint-disable valid-jsdoc */ // Some parts are incorrectly marked as functions
import { releaseProxy, Remote, wrap } from "comlink";
import { Backend } from "./Backend";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import PythonWorker from "./workers/python/PythonWorker.worker";
import JavaScriptWorker from "./workers/javascript/JavaScriptWorker.worker";
import { BackendEvent, BackendEventType } from "./BackendEvent";

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
     * Store Worker per Backend as Comlink proxy has no explicit reference to the Worker
     * We need the Worker itself to be able to terminate it (@see stopBackend)
     */
    static backendMap: Map<Remote<Backend>, Worker> = new Map();
    static createWorkerMap: Map<ProgrammingLanguage, () => Worker> = new Map([
        [ProgrammingLanguage.Python, () => new PythonWorker()],
        [ProgrammingLanguage.JavaScript, () => new JavaScriptWorker()]
    ]);
    /**
     * Map an event type to interested subscribers
     * Uses an Array to maintain order of subscription
     */
    static subscriberMap: Map<BackendEventType, Array<BackendEventListener>> = new Map();
    /**
     * Start a backend for the given language, while storing the worker
     * @param {ProgrammingLanguage} language The programming language supported by the backend
     * @return {Remote<Backend>} A Comlink proxy for the Backend
     */
    static startBackend(language: ProgrammingLanguage): Remote<Backend> {
        if (this.createWorkerMap.has(language)) {
            const worker = this.createWorkerMap.get(language)!();
            const backend = wrap<Backend>(worker);
            // store worker itself in the map
            this.backendMap.set(backend, worker);
            return backend;
        } else {
            throw new Error(`${language} is not yet supported.`);
        }
    }

    /**
     * Stop a backend by terminating the worker and releasing memory
     * @param {Remote<Backend>} backend The proxy for the backend to stop
     */
    static stopBackend(backend: Remote<Backend>): void {
        if (this.backendMap.has(backend)) {
            const toStop = this.backendMap.get(backend)!;
            toStop.terminate();
            backend[releaseProxy]();
            this.backendMap.delete(backend);
        } else {
            throw new Error(`Unknown backend supplied for backend ${JSON.stringify(backend)}`);
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
        if (this.subscriberMap.has(e.type)) {
            this.subscriberMap.get(e.type)!.forEach(cb => cb(e));
        }
    }
}

