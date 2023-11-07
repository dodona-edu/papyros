import { Backend } from "./Backend";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import { BackendEvent, BackendEventType } from "./BackendEvent";
import { Channel } from "sync-message";
import { SyncClient } from "comsync";
/**
 * Callback type definition for subscribers
 * @param {BackendEvent} e The published event
 */
type BackendEventListener = (e: BackendEvent) => void;
/**
 * Abstract class to implement the singleton pattern
 * Static methods group functionality
 */
export declare abstract class BackendManager {
    /**
     * Map programming languages to Backend constructors
     */
    private static createBackendMap;
    /**
     * Map to cache Backends per ProgrammingLanguage
     */
    private static backendMap;
    /**
     * Map an event type to interested subscribers
     * Uses an Array to maintain order of subscription
     */
    private static subscriberMap;
    /**
     * Whether the BackendManager is publishing events
     */
    private static halted;
    /**
     * The channel used to communicate with the SyncClients
     */
    static channel: Channel;
    /**
     * @param {ProgrammingLanguage} language The language to support
     * @param {Function} backendCreator The constructor for a SyncClient
     */
    static registerBackend(language: ProgrammingLanguage, backendCreator: () => SyncClient<Backend>): void;
    /**
     * Start a backend for the given language and cache for reuse
     * @param {ProgrammingLanguage} language The programming language supported by the backend
     * @return {SyncClient<Backend>} A SyncClient for the Backend
     */
    static getBackend(language: ProgrammingLanguage): SyncClient<Backend>;
    /**
     * Remove a backend for the given language
     * @param {ProgrammingLanguage} language The programming language supported by the backend
     * @return {boolean} Whether the remove operation had any effect
     */
    static removeBackend(language: ProgrammingLanguage): boolean;
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
    private static halt;
}
export {};
