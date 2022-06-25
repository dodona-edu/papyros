import { BackendEvent, BackendEventType } from "./BackendEvent";

/**
 * Queue to limit the amount of messages sent between threads
 * This prevents communication issues which arise either in Comlink
 * or in the WebWorker message passing code
 */
export class BackendEventQueue {
    /**
     * Function to process events in the queue
     */
    private callback: (e: BackendEvent) => void;
    /**
     * The maximal amount of output events to send before overflowing
     */
    private limit: number;
    /**
     * The time in milliseconds before sending events through
     */
    private flushTime: number;

    /**
     * Queue storing the BackendEvents before flushing
     */
    private queue: Array<BackendEvent>;
    /**
     * Queue storing Output-events after overflowing
     */
    private overflow: Array<BackendEvent>;
    /**
     * Callback for when overflow occurs
     */
    private onOverflow: () => void;
    /**
     * Keep track whether the queue reached its limit this run
     */
    private overflown: boolean;
    /**
     * Time in milliseconds when the last flush occurred
     */
    private lastFlushTime: number;
    /**
     * Amount of BackendEvents sent through this run
     */
    private sendCount: number;
    /**
     * Decoder to convert data to strings
     */
    private decoder: TextDecoder;

    /**
     * @param {function(BackendEvent):void} callback Function to process events in the queue
     * @param {function():void} onOverflow Callback for when overflow occurs
     * @param {number} limit The maximal amount of output lines to send before overflowing
     * @param {number} flushTime The time in milliseconds before sending events through
     */
    constructor(callback: (e: BackendEvent) => void,
        onOverflow: () => void,
        limit = 1000, flushTime = 100) {
        this.callback = callback;
        this.limit = limit;
        this.flushTime = flushTime;

        this.queue = [];
        this.overflow = [];
        this.onOverflow = onOverflow;
        this.overflown = false;
        this.lastFlushTime = new Date().getTime();
        this.sendCount = 0;
        this.decoder = new TextDecoder();
    }

    /**
     * Add an element to the queue
     * @param {BackendEventType} type The type of the event
     * @param {string | BufferSource} text The data for the event
     * @param {string | any} extra Extra data for the event
     * If string, interpreted as the contentType
     * If anything else, it should contain a contentType
     * If the contentType is not textual, an error is thrown
     */
    public put(type: BackendEventType, text: string | BufferSource, extra: string | any): void {
        let stringData = "";
        if (typeof text !== "string") {
            stringData = this.decoder.decode(text);
        } else {
            stringData = text;
        }
        let extraArgs = {};
        let contentType = "text/plain";
        if (extra) {
            if (typeof extra === "string") {
                contentType = extra;
            } else {
                contentType = extra["contentType"];
                delete extra["contentType"];
                extraArgs = extra;
            }
        }
        if (this.queue.length === 0 ||
            !contentType.startsWith("text") || // Non textual cannot be combined
            this.queue[this.queue.length - 1].type !== type || // Different type
            // Can't be combined if contentType doesn't match
            this.queue[this.queue.length - 1].contentType !== contentType) {
            this.queue.push({
                type: type,
                data: stringData,
                contentType: contentType,
                ...extraArgs
            });
        } else { // Same kind of event, combine into one
            this.queue[this.queue.length - 1].data += stringData;
        }
        if (this.shouldFlush()) {
            this.flush();
        }
    }

    /**
     * @return {boolean} Whether the queue contents should be flushed
     */
    protected shouldFlush(): boolean {
        return this.queue.length > 1 || // different types of Events present
            new Date().getTime() - this.lastFlushTime > this.flushTime;
    }

    /**
     * Reset the queue contents for a new run
     */
    public reset(): void {
        this.queue = [];
        this.overflow = [];
        this.overflown = false;
        this.lastFlushTime = new Date().getTime();
        this.sendCount = 0;
    }

    /**
     * @param {BackendEvent} e The event put in the queue
     * @return {number} The amount of lines of data in the event
     */
    private static lines(e: BackendEvent): number {
        return (e.data.match(/\n/g) || []).length + 1;
    }

    /**
     * Flush the queue contents using the callback
     */
    public flush(): void {
        this.queue.forEach(e => {
            if (e.type === BackendEventType.Output) {
                this.overflow.push(e);
                if (this.sendCount < this.limit) {
                    this.sendCount += BackendEventQueue.lines(e);
                    this.callback(e);
                } else if (!this.overflown) {
                    this.overflown = true;
                    this.onOverflow();
                }
            } else {
                this.callback(e);
            }
        });
        this.queue = [];
        this.lastFlushTime = new Date().getTime();
    }

    /**
     * @return {boolean} Whether too many output events were generated
     */
    public hasOverflow(): boolean {
        return this.overflown;
    }

    /**
     * @return {Array<BackendEvent>} The events that happened after overflow
     */
    public getOverflow(): Array<BackendEvent> {
        return this.overflow;
    }

    /**
     * @param {Function} callback The event-consuming callback
     */
    public setCallback(callback: (e: BackendEvent) => void): void {
        this.callback = callback;
    }
}
