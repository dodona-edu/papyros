import { CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { BackendEvent } from "./BackendEvent";
import { SyncExtras } from "comsync";
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
    lineNr: number;
    columnNr: number;
    severity: "info" | "warning" | "error";
    message: string;
}
export declare abstract class Backend<Extras extends SyncExtras = SyncExtras> {
    protected extras: Extras;
    protected onEvent: (e: BackendEvent) => any;
    /**
     *  Constructor is limited as it is meant to be used as a WebWorker
     *  These are then exposed via Comlink. Proper initialization occurs
     *  in the launch method when the worker is started
     * @param {Array<string>} syncMethods The methods to expose
     */
    constructor(syncMethods?: string[]);
    /**
     * @return {any} The function to expose methods for Comsync to allow interrupting
     */
    protected syncExpose(): any;
    /**
     * Expose all the methods that should support being interrupted
     * @param {Array<string>} syncMethods The names of the methods to expose
     */
    protected exposeMethods(syncMethods: Array<string>): void;
    /**
     * Initialize the backend by doing all setup-related work
     * @param {function(BackendEvent):void} onEvent Callback for when events occur
     * @return {Promise<void>} Promise of launching
     */
    launch(onEvent: (e: BackendEvent) => void): Promise<void>;
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
    abstract lintCode(code: string): Promise<Array<WorkerDiagnostic>>;
}
