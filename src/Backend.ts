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

export interface WorkerDiagnostic {
    lineNr: number;
    columnNr: number;
    severity: "info" | "warning" | "error";
    message: string;
}

export abstract class Backend<Extras extends SyncExtras = SyncExtras> {
    protected extras: Extras;
    protected onEvent: (e: BackendEvent) => any;
    protected initialInput: Array<string>;
    /**
     * Constructor is limited as it is meant to be used as a WebWorker
     * Proper initialization occurs in the launch method when the worker is started
     * Synchronously exposing methods should be done here
     */
    constructor() {
        this.extras = {} as Extras;
        this.initialInput = [];
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        this.onEvent = () => { };
        this.runCode = this.syncExpose()(this.runCode.bind(this));
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
            // Handle input events immediately if possible
            if (e.type === BackendEventType.Input && this.initialInput.length > 0) {
                return this.initialInput.splice(0, 1)[0];
            }
            onEvent(e);
            if (e.type === BackendEventType.Sleep) {
                return this.extras.syncSleep(e.data);
            } else if (e.type === BackendEventType.Input) {
                return this.extras.readMessage();
            }
        };
        return Promise.resolve();
    }

    /**
     * @param {string | Array<string>} input Optional input from the user to use before prompting
     */
    setInitialInput(input: string | Array<string>): void {
        if (input.length > 0) {
            this.initialInput = typeof input === "string" ? input.split("\n") : input;
        } else {
            this.initialInput = [];
        }
    }

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

    abstract lintCode(code: string): Promise<Array<WorkerDiagnostic>>;
}
