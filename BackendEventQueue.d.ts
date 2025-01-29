import { BackendEvent, BackendEventType } from "./BackendEvent";
/**
 * Queue to limit the amount of messages sent between threads
 * This prevents communication issues which arise either in Comlink
 * or in the WebWorker message passing code
 */
export declare class BackendEventQueue {
    /**
     * Function to process events in the queue
     */
    private callback;
    /**
     * The maximal amount of output events to send before overflowing
     */
    private limit;
    /**
     * The time in milliseconds before sending events through
     */
    private flushTime;
    /**
     * Queue storing the BackendEvents before flushing
     */
    private queue;
    /**
     * Queue storing Output-events after overflowing
     */
    private overflow;
    /**
     * Callback for when overflow occurs
     */
    private onOverflow;
    /**
     * Keep track whether the queue reached its limit this run
     */
    private overflown;
    /**
     * Time in milliseconds when the last flush occurred
     */
    private lastFlushTime;
    /**
     * Amount of BackendEvents sent through this run
     */
    private sendCount;
    /**
     * Decoder to convert data to strings
     */
    private decoder;
    /**
     * @param {function(BackendEvent):void} callback Function to process events in the queue
     * @param {function():void} onOverflow Callback for when overflow occurs
     * @param {number} limit The maximal amount of output lines to send before overflowing
     * @param {number} flushTime The time in milliseconds before sending events through
     */
    constructor(callback: (e: BackendEvent) => void, onOverflow: () => void, limit?: number, flushTime?: number);
    /**
     * Add an element to the queue
     * @param {BackendEventType} type The type of the event
     * @param {string | BufferSource | number} text The data for the event
     * @param {string | any} extra Extra data for the event
     * If string, interpreted as the contentType
     * If anything else, it should contain a contentType
     * If the contentType is not textual, an error is thrown
     */
    put(type: BackendEventType, text: string | BufferSource | number, extra: string | any): void;
    /**
     * @return {boolean} Whether the queue contents should be flushed
     */
    protected shouldFlush(): boolean;
    /**
     * Reset the queue contents for a new run
     */
    reset(): void;
    /**
     * @param {BackendEvent} e The event put in the queue
     * @return {number} The amount of lines of data in the event
     */
    private static lines;
    /**
     * Flush the queue contents using the callback
     */
    flush(): void;
    /**
     * @return {boolean} Whether too many output events were generated
     */
    hasOverflow(): boolean;
    /**
     * @return {Array<BackendEvent>} The events that happened after overflow
     */
    getOverflow(): Array<BackendEvent>;
    /**
     * @param {Function} callback The event-consuming callback
     */
    setCallback(callback: (e: BackendEvent) => void): void;
}
