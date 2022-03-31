import { Backend } from "./Backend";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import { BackendEvent, BackendEventType } from "./BackendEvent";
import { Channel } from "sync-message";
import { SyncClient } from "comsync";
/**
 * Callback type definition for subscribers
 * @param {BackendEvent} e The published event
 */
declare type BackendEventListener = (e: BackendEvent) => void;
declare class Cacheable<T> {
    private cached;
    private createFn;
    constructor(createFn: () => T);
    get(): T;
}
/**
 * Abstract class to implement the singleton pattern
 * Static methods group functionality
 */
export declare abstract class BackendManager {
    static createWorkerMap: Map<ProgrammingLanguage, Cacheable<SyncClient<Backend>>>;
    static channel: Channel;
    /**
     * Map an event type to interested subscribers
     * Uses an Array to maintain order of subscription
     */
    static subscriberMap: Map<BackendEventType, Array<BackendEventListener>>;
    private static buildSyncClientMap;
    /**
     * Start a backend for the given language, while storing the worker
     * @param {ProgrammingLanguage} language The programming language supported by the backend
     * @return {Remote<Backend>} A Comlink proxy for the Backend
     */
    static startBackend(language: ProgrammingLanguage): SyncClient<Backend>;
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
