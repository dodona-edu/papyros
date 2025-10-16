import { BackendEvent, BackendEventType } from "../communication/BackendEvent";
import { syncExpose, SyncExtras } from "comsync";
import { BackendEventQueue } from "../communication/BackendEventQueue";

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

export enum RunMode {
    Run = "run",
    Debug = "debug",
    Doctest = "doctest",
}

export abstract class Backend<Extras extends SyncExtras = SyncExtras> {
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
    public async launch(onEvent: (e: BackendEvent) => void): Promise<void> {
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
     * Determine whether the modes supported by this Backend are active
     * @param {string} code The current code in the editor
     * @return {Array<RunMode>} The run modes of this Backend
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public runModes(code: string): Array<RunMode> {
        return [];
    }

    /**
     * Executes the given code
     * @param {Extras} extras Helper properties to run code
     * @param {string} code The code to run
     * @param {string} mode The mode to run the code in
     * @return {Promise<void>} Promise of execution
     */
    public abstract runCode(extras: Extras, code: string, mode?: string): Promise<void>;

    /**
     * Generate linting suggestions for the given code
     * @param {string} code The code to lint
     */
    public abstract lintCode(code: string): Promise<Array<WorkerDiagnostic>>;

    /**
     * Provide files to be used by the backend
     * @param {Record<string, string>} inlineFiles Map of file names to their contents
     * @param {Record<string, string>} hrefFiles Map of file names to URLS with their contents
     * @return {Promise<void>} Resolves when the files are present in the backend
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public provideFiles(inlineFiles: Record<string, string>, hrefFiles: Record<string, string>): Promise<void> {
        return Promise.resolve();
    }
}
