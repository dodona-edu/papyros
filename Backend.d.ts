import { PapyrosEvent } from "./PapyrosEvent";
import { Channel } from "sync-message";
import { CompletionContext, CompletionResult } from "@codemirror/autocomplete";
export interface WorkerAutocompleteContext {
    explicit: boolean;
    pos: number;
    line: number;
    column: number;
    text: string;
    before: {
        from: number;
        to: number;
        text: string;
    } | null;
}
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
    protected abstract runCodeInternal(code: string): Promise<void>;
    /**
     * Executes the given code
     * @param {string} code The code to run
     * @param {string} runId The uuid for this execution
     * @return {Promise<void>} Promise of execution
     */
    runCode(code: string, runId: number): Promise<void>;
    /**
     * Run a piece of code in debug mode, allowing the user to figure out
     * why things do or do not work
     * @param {string} code The code to debug
     * @param {number} runId The internal identifier for this code run
     * @param {Set<number>} breakpoints The line numbers where the user put a breakpoint
     * @return {Promise<void>} Promise of debugging
     */
    debugCode(code: string, runId: number, breakpoints: Set<number>): Promise<void>;
    /**
     * Internal helper method that actually debugs the code
     * Communication is done by using the onEvent-callback
     * @param {string} code The code to debug
     * @param {Set<number>} breakpoints The line numbers where the user put a breakpoint
     * @return {Promise<void>} Promise of debugging
     */
    protected abstract debugCodeInternal(code: string, breakpoints: Set<number>): Promise<any>;
    /**
     * Converts the context to a cloneable object containing useful properties
     * to generate autocompletion suggestions with
     * @param {CompletionContext} context Current context to autocomplete for
     * @param {RegExp} expr Expression to match the previous token with
     * @return {WorkerAutocompleteContext} Completion context that can be passed as a message
     */
    static convertCompletionContext(context: CompletionContext, expr?: RegExp): WorkerAutocompleteContext;
    /**
     * Generate autocompletion suggestions for the given context
     * @param {WorkerAutocompleteContext} context Context to autcomplete in
     */
    abstract autocomplete(context: WorkerAutocompleteContext): Promise<CompletionResult | null>;
}
