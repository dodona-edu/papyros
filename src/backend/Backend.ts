import { BackendEvent, BackendEventType } from "../communication/BackendEvent";
import { expose, SyncExtras } from "../sync/expose";
import { InterruptError } from "../sync/errors";
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

export abstract class Backend {
    /**
     * SyncExtras object that grants access to helpful methods
     * for synchronous operations
     */
    protected extras: SyncExtras;
    /**
     * Whether input and sleep suspend the wasm stack (JSPI) instead of blocking on the channel.
     * Only Pyodide can do this, and only where the browser supports stack switching.
     */
    protected jspi = false;
    /**
     * Settles the promise this backend is suspended on while it waits for the main
     * thread to answer, if it is waiting at all
     */
    private pending?: { resolve: (value: any) => void };
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
        this.extras = {} as SyncExtras;
        this.onEvent = () => {
            // Empty, initialized in launch
        };
        this.runCode = this.expose()(this.runCode.bind(this));
        this.queue = {} as BackendEventQueue;
    }

    /**
     * @return {any} The wrapper that lets SyncClient drive exposed methods
     */
    protected expose(): any {
        return expose;
    }

    /**
     * Initialize the backend by doing all setup-related work
     * @param {function(BackendEvent):void} onEvent Callback for when events occur
     * @param {string|undefined} pyodideAssetURL Optional location where pyodide assets can be fetched from if the backend needs it
     * @param {boolean} allowJspi Whether the backend may suspend the wasm stack instead of using the channel
     * @return {Promise<void>} Promise of launching
     */
    public async launch(
        onEvent: (e: BackendEvent) => void,
        pyodideAssetURL: string | undefined,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        allowJspi: boolean = true,
    ): Promise<void> {
        this.onEvent = (e: BackendEvent) => {
            onEvent(e);
            if (e.type === BackendEventType.Sleep) {
                return this.jspi ? this.suspendForSleep(e.data) : this.extras.syncSleep(e.data);
            } else if (e.type === BackendEventType.Input) {
                return this.jspi ? this.suspendForInput() : this.extras.readMessage();
            }
        };
        this.queue = new BackendEventQueue(this.onEvent.bind(this));
        return Promise.resolve();
    }

    /**
     * Whether this backend expects input to be delivered by resolving a promise
     * instead of by writing to the channel. Read once by the client after launching.
     * @return {boolean} Whether the JSPI transport is in use
     */
    public usesJspi(): boolean {
        return this.jspi;
    }

    /**
     * Answer the main thread question this backend is suspended on
     * @param {any} message The value to resume with
     * @return {boolean} Whether the backend was waiting for it
     */
    public receiveMessage(message: any): boolean {
        const pending = this.pending;
        if (!pending) {
            return false;
        }
        this.pending = undefined;
        pending.resolve(message);
        return true;
    }

    /**
     * Abort the main thread question this backend is suspended on. The answer is an
     * InterruptError value, which the Python side raises as KeyboardInterrupt so the
     * worker survives. Pyodide prints a rejected promise's error to the program's
     * stderr, so the promise must not reject.
     * @return {boolean} Whether the backend was waiting
     */
    public interruptMessage(): boolean {
        const pending = this.pending;
        if (!pending) {
            return false;
        }
        this.pending = undefined;
        pending.resolve(new InterruptError());
        return true;
    }

    /**
     * Suspend until the main thread provides input
     * @return {Promise<string>} The value the user entered
     */
    private suspendForInput(): Promise<string | InterruptError> {
        this.extras.reportStatus("reading");
        return new Promise<string | InterruptError>((resolve) => {
            this.pending = { resolve };
        });
    }

    /**
     * Suspend for the requested duration, remaining interruptible throughout
     * @param {number} ms How long to sleep
     * @return {Promise<void>} Resolves once the time has passed
     */
    private suspendForSleep(ms: number): Promise<void | InterruptError> {
        this.extras.reportStatus("sleeping");
        return new Promise<void | InterruptError>((resolve) => {
            const timer = setTimeout(() => {
                this.pending = undefined;
                this.extras.reportStatus("slept");
                resolve();
            }, ms);
            this.pending = {
                resolve: (value: void | InterruptError) => {
                    clearTimeout(timer);
                    this.extras.reportStatus("slept");
                    resolve(value);
                },
            };
        });
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
     * @param {SyncExtras} extras Helper properties to run code
     * @param {string} code The code to run
     * @param {string} mode The mode to run the code in
     * @param {number} maxSteps Upper bound on the number of debug frames a backend should produce, if it supports one
     * @return {Promise<void>} Promise of execution
     */
    public abstract runCode(extras: SyncExtras, code: string, mode?: string, maxSteps?: number): Promise<void>;

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

    /**
     * Delete a file from the backend filesystem
     * @param {string} name The name of the file to delete
     * @return {Promise<void>} Resolves when the file has been deleted
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public deleteFile(name: string): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Update the content of a file in the backend filesystem
     * @param {string} name The name of the file to update
     * @param {string} content The new content of the file; base64-encoded when binary is true
     * @param {boolean} binary Whether the content is binary (base64-encoded) rather than plain text
     * @return {Promise<void>} Resolves when the file has been updated
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public updateFile(name: string, content: string, binary: boolean): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Rename a file in the backend filesystem
     * @param {string} oldName The current name of the file
     * @param {string} newName The new name of the file
     * @return {Promise<void>} Resolves when the file has been renamed
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public renameFile(oldName: string, newName: string): Promise<void> {
        return Promise.resolve();
    }
}
