import { PapyrosEvent } from "./PapyrosEvent";
import { Channel } from "sync-message";
export declare abstract class Backend {
    protected onEvent: (e: PapyrosEvent) => any;
    protected runId: number;
    /**
     *  Constructor is limited as it is meant to be used as a WebWorker
     *  These are then exposed via Comlink. Proper initialization occurs
     *  in the launch method when the worker is started
     */
    constructor();
    /**
     * Initialize the backend by doing all setup-related work
     * @param {function(PapyrosEvent):void} onEvent Callback for when events occur
     * @param {Channel} channel for communication with the main thread
     * @return {Promise<void>} Promise of launching
     */
    launch(onEvent: (e: PapyrosEvent) => void, channel: Channel): Promise<void>;
    /**
     * Internal helper method that actually executes the code
     * Results or Errors must be passed by using the onEvent-callback
     * @param code The code to run
     */
    protected abstract _runCodeInternal(code: string): Promise<any>;
    /**
     * Executes the given code
     * @param {string} code The code to run
     * @param {string} runId The uuid for this execution
     * @return {Promise<void>} Promise of execution
     */
    runCode(code: string, runId: number): Promise<any>;
}
