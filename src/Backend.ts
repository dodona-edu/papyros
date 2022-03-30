import { PapyrosEvent } from "./PapyrosEvent";
import { Channel, readMessage, uuidv4 } from "sync-message";
import { parseData } from "./util/Util";
import { CompletionContext, CompletionResult } from "@codemirror/autocomplete";

/**
 * Interface to represent the CodeMirror CompletionContext in a worker
 */
export interface WorkerAutocompleteContext {
    /**
     * Whether the autocompletion was explicitly requested (using keybindings)
     */
    explicit: boolean;
    /**
     * The absolute position in the CodeMirror document
     */
    pos: number;
    /**
     * The line number of the cursor while completing (1-based)
     */
    line: number;
    /**
     * The column number of the cursor while completing (1-based)
     */
    column: number;
    /**
     * The full text to autocomplete for
     */
    text: string;
    /**
     * The match before the cursor (determined by a regex)
     */
    before: {
        from: number; // Absolute position of the start of the match
        to: number; // Absolute position of the end of the match
        text: string; // The matched text
    } | null;
}

export abstract class Backend {
    protected onEvent: (e: PapyrosEvent) => any;
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
     * @param {function(PapyrosEvent):void} onEvent Callback for when events occur
     * @param {Channel} channel for communication with the main thread
     * @return {Promise<void>} Promise of launching
     */
    launch(
        onEvent: (e: PapyrosEvent) => void,
        channel: Channel
    ): Promise<void> {
        // Input messages are handled in a special way
        // In order to link input requests to their responses
        // An ID is required to make the connection
        // The message must be read in the worker to not stall the main thread
        const onInput = (e: PapyrosEvent): string => {
            const inputData = parseData(e.data, e.contentType);
            const messageId = uuidv4();
            inputData.messageId = messageId;
            e.data = JSON.stringify(inputData);
            e.contentType = "text/json";
            onEvent(e);
            return readMessage(channel, messageId);
        };
        this.onEvent = (e: PapyrosEvent) => {
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
    protected abstract _runCodeInternal(code: string): Promise<any>;

    /**
     * Executes the given code
     * @param {string} code The code to run
     * @param {string} runId The uuid for this execution
     * @return {Promise<void>} Promise of execution
     */
    async runCode(code: string, runId: number): Promise<any> {
        this.runId = runId;
        return await this._runCodeInternal(code);
    }

    /**
     * Converts the context to a cloneable object containing useful properties
     * to generate autocompletion suggestions with
     * Class instances are not passable to workers, so we extract the useful infromation
     * @param {CompletionContext} context Current context to autocomplete for
     * @param {RegExp} expr Expression to match the previous token with
     * default a word with an optional dot to represent property access
     * @return {WorkerAutocompleteContext} Completion context that can be passed as a message
     */
    static convertCompletionContext(context: CompletionContext, expr = /\w*(\.)?/):
        WorkerAutocompleteContext {
        const [lineNr, column] = context.state.selection.ranges.map(range => {
            const line = context.state.doc.lineAt(range.head);
            return [line.number, (range.head - line.from)];
        })[0];
        const beforeMatch = context.matchBefore(expr);
        return {
            explicit: context.explicit,
            before: beforeMatch,
            pos: context.pos,
            column: column,
            line: lineNr,
            text: context.state.doc.toString()
        };
    }

    /**
     * Generate autocompletion suggestions for the given context
     * @param {WorkerAutocompleteContext} context Context to autcomplete in
     */
    abstract autocomplete(context: WorkerAutocompleteContext): Promise<CompletionResult | null>;
}
