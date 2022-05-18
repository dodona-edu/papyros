import { CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { BackendEvent } from "./BackendEvent";
import { SyncExtras } from "comsync";
import { BackendEventQueue } from "./BackendEventQueue";
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
        from: number;
        to: number;
        text: string;
    } | null;
}
export interface WorkerDiagnostic {
    /**
     * 1-based index of the starting line containing the issue
     */
    lineNr: number;
    /**
     * 0-based index of the column in the starting line
     */
    columnNr: number;
    /**
     * 1-based index of the ending line containing the issue
     * Can be the same as lineNr
     */
    endLineNr: number;
    /**
     * 0-based index of the column in the ending line
     */
    endColumnNr: number;
    /**
     * Severity of the issue
     */
    severity: "info" | "warning" | "error";
    /**
     * Message describing the issue
     */
    message: string;
}
export declare abstract class Backend<Extras extends SyncExtras = SyncExtras> {
    /**
     * SyncExtras object that grants access to helpful methods
     * for synchronous operations
     */
    protected extras: Extras;
    /**
     * Callback to handle events published by this Backend
     */
    protected onEvent: (e: BackendEvent) => any;
    /**
     * Queue to handle published events without overloading the thread
     */
    protected queue: BackendEventQueue;
    /**
     * Constructor is limited as it is meant to be used as a WebWorker
     * Proper initialization occurs in the launch method when the worker is started
     * Synchronously exposing methods should be done here
     */
    constructor();
    /**
     * @return {any} The function to expose methods for Comsync to allow interrupting
     */
    protected syncExpose(): any;
    /**
     * Initialize the backend by doing all setup-related work
     * @param {function(BackendEvent):void} onEvent Callback for when events occur
     * @param {function():void} onOverflow Callback for when overflow occurs
     * @return {Promise<void>} Promise of launching
     */
    launch(onEvent: (e: BackendEvent) => void, onOverflow: () => void): Promise<void>;
    /**
     * Executes the given code
     * @param {Extras} extras Helper properties to run code
     * @param {string} code The code to run
     * @return {Promise<void>} Promise of execution
     */
    abstract runCode(extras: Extras, code: string): Promise<void>;
    /**
     * Converts the context to a cloneable object containing useful properties
     * to generate autocompletion suggestions with
     * Class instances are not passable to workers, so we extract the useful information
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
    /**
     * Generate linting suggestions for the given code
     * @param {string} code The code to lint
     */
    abstract lintCode(code: string): Promise<Array<WorkerDiagnostic>>;
    /**
     * @return {boolean} Whether too many output events were generated
     */
    hasOverflow(): boolean;
    /**
     * @return {Array<BackendEvent>} The events that happened after overflow
     */
    getOverflow(): Array<BackendEvent>;
}
