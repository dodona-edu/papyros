import { Remote } from "comlink";
import { Backend } from "./Backend";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import { BackendEvent, BackendEventType } from "./BackendEvent";
/**
 * Callback type definition for subscribers
 * @param {BackendEvent} e The published event
 */
declare type BackendEventListener = (e: BackendEvent) => void;
/**
 * Abstract class to implement the singleton pattern
 * Static methods group functionality
 */
export declare abstract class BackendManager {
    /**
     * Store Worker per Backend as Comlink proxy has no explicit reference to the Worker
     * We need the Worker itself to be able to terminate it (@see stopBackend)
     */
    static backendMap: Map<Remote<Backend>, Worker>;
    static createWorkerMap: Map<ProgrammingLanguage, () => Worker>;
    /**
     * Map an event type to interested subscribers
     * Uses an Array to maintain order of subscription
     */
    static subscriberMap: Map<BackendEventType, Array<BackendEventListener>>;
    /**
     * Start a backend for the given language, while storing the worker
     * @param {ProgrammingLanguage} language The programming language supported by the backend
     * @return {Remote<Backend>} A Comlink proxy for the Backend
     */
    static startBackend(language: ProgrammingLanguage): Remote<Backend>;
    /**
     * Stop a backend by terminating the worker and releasing memory
     * @param {Remote<Backend>} backend The proxy for the backend to stop
     */
    static stopBackend(backend: Remote<Backend>): void;
    /**
     * Register a callback for when an event of a certain type is published
     * @param {BackendEventType} type The type of event to subscribe to
     * @param {BackendEventListener} subscriber Callback for when an event
     * of the given type is published
     */
    static subscribe(type: BackendEventType, subscriber: BackendEventListener): void;
    /**
     * Publish an event, notifying all listeners for its type
     * @param {BackendEventType} e The event to publish
     */
    static publish(e: BackendEvent): void;
}
export {};
