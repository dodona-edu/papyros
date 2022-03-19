import { BackendEvent } from "./BackendEvent";
import { Channel, readMessage, uuidv4 } from "sync-message";
import { parseData } from "./util/Util";
import { CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { LogType, papyrosLog } from "./util/Logging";

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

export abstract class Backend {
    protected onEvent: (e: BackendEvent) => any;
    protected runId: number;

    /**
     *  Constructor is limited as it is meant to be used as a WebWorker
     *  These are then exposed via Comlink. Proper initialization occurs
     *  in the launch method when the worker is started
     */
    constructor() {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        this.onEvent = () => { };
        this.runId = 0;
    }

    /**
     * Initialize the backend by doing all setup-related work
     * @param {function(BackendEvent):void} onEvent Callback for when events occur
     * @param {Channel} channel for communication with the main thread
     * @return {Promise<void>} Promise of launching
     */
    launch(
        onEvent: (e: BackendEvent) => void,
        channel: Channel
    ): Promise<void> {
        // Input messages are handled in a special way
        // In order to link input requests to their responses
        // An ID is required to make the connection
        // The message must be read in the worker to not stall the main thread
        const onInput = (e: BackendEvent): string => {
            const inputData = parseData(e.data, e.contentType);
            const messageId = uuidv4();
            inputData.messageId = messageId;
            e.data = JSON.stringify(inputData);
            e.contentType = "text/json";
            onEvent(e);
            return readMessage(channel, messageId);
        };
        this.onEvent = (e: BackendEvent) => {
            e.runId = this.runId;
            if (e.type === "input") {
                return onInput(e);
            } else {
                return onEvent(e);
            }
        };
        return Promise.resolve();
    }

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
    async runCode(code: string, runId: number): Promise<void> {
        this.runId = runId;
        return await this.runCodeInternal(code);
    }

    /**
     * Run a piece of code in debug mode, allowing the user to figure out
     * why things do or do not work
     * @param {string} code The code to debug
     * @param {number} runId The internal identifier for this code run
     * @param {Set<number>} breakpoints The line numbers where the user put a breakpoint
     * @return {Promise<void>} Promise of debugging
     */
    debugCode(code: string, runId: number, breakpoints: Set<number>): Promise<void> {
        this.runId = runId;
        return this.debugCodeInternal(code, breakpoints);
    }

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
    static convertCompletionContext(context: CompletionContext, expr = /\w*(\.)?/):
        WorkerAutocompleteContext {
        const [lineNr, column] = context.state.selection.ranges.map(range => {
            const line = context.state.doc.lineAt(range.head);
            return [line.number, (range.head - line.from)];
        })[0];
        const beforeMatch = context.matchBefore(expr);
        const ret = {
            explicit: context.explicit,
            before: beforeMatch,
            pos: context.pos,
            column: column,
            line: lineNr,
            text: context.state.doc.toString()
        };
        papyrosLog(LogType.Debug, "Worker completion context:", ret);
        return ret;
    }

    /**
     * Generate autocompletion suggestions for the given context
     * @param {WorkerAutocompleteContext} context Context to autcomplete in
     */
    abstract autocomplete(context: WorkerAutocompleteContext): Promise<CompletionResult | null>;
}
