import { CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { BackendEvent, BackendEventType } from "./BackendEvent";
import { syncExpose, SyncExtras } from "comsync";
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
        from: number; // Absolute position of the start of the match
        to: number; // Absolute position of the end of the match
        text: string; // The matched text
    } | null;
}

export interface WorkerDiagnostic {
    lineNr: number;
    columnNr: number;
    severity: "info" | "warning" | "error";
    message: string;
}

export abstract class Backend<Extras extends SyncExtras = SyncExtras> {
    protected extras: Extras;
    protected onEvent: (e: BackendEvent) => any;
    protected queue: BackendEventQueue;
    /**
     * Constructor is limited as it is meant to be used as a WebWorker
     * Proper initialization occurs in the launch method when the worker is started
     * Synchronously exposing methods should be done here
     */
    constructor() {
        this.extras = {} as Extras;
        this.onEvent = () => {
            // Empty, initialized in launch
        };
        this.runCode = this.syncExpose()(this.runCode.bind(this));
        this.queue = {} as BackendEventQueue;
    }

    /**
     * @return {any} The function to expose methods for Comsync to allow interrupting
     */
    protected syncExpose(): any {
        return syncExpose;
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
                return this.extras.syncSleep(e.data);
            } else if (e.type === BackendEventType.Input) {
                return this.extras.readMessage();
            }
        };
        this.queue = new BackendEventQueue(this.onEvent.bind(this));
        return Promise.resolve();
    }

    /**
     * Executes the given code
     * @param {Extras} extras Helper properties to run code
     * @param {string} code The code to run
     * @return {Promise<void>} Promise of execution
     */
    public abstract runCode(extras: Extras, code: string): Promise<void>;

    /**
     * Converts the context to a cloneable object containing useful properties
     * to generate autocompletion suggestions with
     * Class instances are not passable to workers, so we extract the useful information
     * @param {CompletionContext} context Current context to autocomplete for
     * @param {RegExp} expr Expression to match the previous token with
     * @return {WorkerAutocompleteContext} Completion context that can be passed as a message
     */
    public static convertCompletionContext(context: CompletionContext, expr = /\w*(\.)?/):
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
    public abstract autocomplete(context: WorkerAutocompleteContext):
        Promise<CompletionResult | null>;

    /**
     * Generate linting suggestions for the given code
     * @param {string} code The code to lint
     */
    public abstract lintCode(code: string): Promise<Array<WorkerDiagnostic>>;

    /**
     * @return {boolean} Whether too many output events were generated
     */
    public hasOverflow(): boolean {
        return this.queue.hasOverflow();
    }

    /**
     * @return {Array<BackendEvent>} The events that happened after overflow
     */
    public getOverflow(): Array<BackendEvent> {
        return this.queue.getOverflow();
    }
}
