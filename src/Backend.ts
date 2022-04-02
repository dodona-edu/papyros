import { CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { BackendEvent, BackendEventType } from "./BackendEvent";
import { papyrosLog, LogType } from "./util/Logging";
import { syncExpose, SyncExtras } from "comsync";

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
    protected syncExtras: SyncExtras;
    protected onEvent: (e: BackendEvent) => any;
    /**
     *  Constructor is limited as it is meant to be used as a WebWorker
     *  These are then exposed via Comlink. Proper initialization occurs
     *  in the launch method when the worker is started
     * @param {Array<string>} syncMethods The methods to expose
     */
    constructor(syncMethods = ["runCode"]) {
        this.syncExtras = {} as SyncExtras;
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        this.onEvent = () => { };
        this.exposeMethods(Array.from(syncMethods));
    }

    /**
     * @return {any} The function to expose methods for Comsync to allow interrupting
     */
    protected syncExpose(): any {
        return syncExpose;
    }

    /**
     * Expose all the methods that should support being interrupted
     * @param {Array<string>} syncMethods The names of the methods to expose
     */
    protected exposeMethods(syncMethods: Array<string>): void {
        syncMethods.forEach(m => {
            const method = (this as any)[m];
            (this as any)[m] = this.syncExpose()(method.bind(this));
        });
    }

    /**
     * Initialize the backend by doing all setup-related work
     * @param {function(BackendEvent):void} onEvent Callback for when events occur
     * @return {Promise<void>} Promise of launching
     */
    launch(
        onEvent: (e: BackendEvent) => void
    ): Promise<void> {
        this.onEvent = (e: BackendEvent) => {
            onEvent(e);
            if (e.type === BackendEventType.Sleep) {
                return this.syncExtras.syncSleep(e.data);
            } else if (e.type === BackendEventType.Input) {
                return this.syncExtras.readMessage();
            }
        };
        return Promise.resolve();
    }

    /**
     * Executes the given code
     * @param {string} code The code to run
     * @return {Promise<void>} Promise of execution
     */
    abstract runCode(extras: SyncExtras, code: string): Promise<void>;

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
