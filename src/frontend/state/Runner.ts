import { proxy } from "comlink";
import { SyncClient } from "comsync";
import { Backend, RunMode, WorkerDiagnostic } from "../../backend/Backend";
import { BackendEvent, BackendEventType } from "../../communication/BackendEvent";
import { BackendManager } from "../../communication/BackendManager";
import { parseData } from "../../util/Util";
import { State, stateProperty } from "@dodona/lit-state";
import { Papyros } from "../../Papyros";
import { ProgrammingLanguage } from "../../ProgrammingLanguage";


/**
 * Enum representing the possible states while processing code
 */
export enum RunState {
    Loading = "loading",
    Running = "running",
    AwaitingInput = "awaiting_input",
    Stopping = "stopping",
    Ready = "ready"
}

/**
 * Interface to represent information required when handling loading events
 */
export interface LoadingData {
    /**
     * List of module names that are being loaded
     */
    modules: Array<string>;
    /**
     * The status of the import
     */
    status: "loading" | "loaded" | "failed";

}

/**
 * Helper component to manage and visualize the current RunState
 */
export class Runner extends State {
    /**
     * The currently used programming language
     */
    @stateProperty
    private _programmingLanguage: ProgrammingLanguage = ProgrammingLanguage.Python;
    @stateProperty
    public get programmingLanguage(): ProgrammingLanguage {return this._programmingLanguage}
    public set programmingLanguage(value: ProgrammingLanguage) {
        if (this._programmingLanguage !== value) {
            this._programmingLanguage = value;
            this.launch();
        }
    }
    /**
     * The backend that executes the code asynchronously
     */
    @stateProperty
    public backend: Promise<SyncClient<Backend>>;
    /**
     * Current state of the program
     */
    @stateProperty
    public state: RunState = RunState.Ready;
    /**
     * An explanatory message about the current state
     */
    @stateProperty
    public stateMessage: string = "";
    /**
     * Previous state to restore when loading is done
     */
    private previousState: RunState = RunState.Ready;
    /**
     * Array of packages that are being installed
     */
    @stateProperty
    public loadingPackages: Array<string> = [];
    /**
     * Time at which the setState call occurred
     */
    @stateProperty
    public runStartTime: number = new Date().getTime();
    /**
     * The code we are working with
     */
    @stateProperty
    public _code: string = "";

    @stateProperty
    public get code(): string {
        return this._code;
    }

    public set code(value: string) {
        if (this._code !== value) {
            this._code = value;
            this.updateRunModes();
        }
    }

    /**
     * Async getter for the linting diagnostics of the current code
     */
    public async lintSource(): Promise<WorkerDiagnostic[]> {
        const backend = await this.backend;
        return await backend.workerProxy.lintCode(this.code);
    }

    /**
     * available run modes for the current code
     */
    @stateProperty
    public runModes: Array<RunMode> = [RunMode.Debug];

    /**
     * The global state where we are part of
     */
    private papyros: Papyros;

    constructor(papyros: Papyros) {
        super();
        this.papyros = papyros;
        this.backend = Promise.resolve({} as SyncClient<Backend>);

        BackendManager.subscribe(BackendEventType.Input, () => this.setState(RunState.AwaitingInput));
        BackendManager.subscribe(BackendEventType.Loading, e => this.onLoad(e));
        BackendManager.subscribe(BackendEventType.Start, e => this.onStart(e));
        BackendManager.subscribe(BackendEventType.Stop, () => this.stop());
    }

    /**
     * Stops the current run and resets the state of the program
     * Regular and debug output is cleared
     * @return {Promise<void>} Returns when the program has been reset
     */
    public async reset(): Promise<void> {
        if (![RunState.Ready, RunState.Loading].includes(this.state)) {
            await this.stop();
        }

        this.papyros.debugger.active = false;
    }

    /**
     * Start the backend to enable running code
     */
    public async launch(): Promise<void> {
        this.setState(RunState.Loading);
        const backend = BackendManager.getBackend(this.programmingLanguage);
        // Use a Promise to immediately enable running while downloading
        // eslint-disable-next-line no-async-promise-executor
        this.backend = new Promise(async resolve => {
            const workerProxy = backend.workerProxy;
            // Allow passing messages between worker and main thread
            await workerProxy.launch(proxy((e: BackendEvent) => BackendManager.publish(e)));
            this.updateRunModes();
            return resolve(backend);
        });
        this.setState(RunState.Ready);
    }

    /**
     * Execute the code in the editor
     * @param {RunMode} mode The mode to run with
     * @return {Promise<void>} Promise of running the code
     */
    public async start(mode?: RunMode): Promise<void> {
        this.papyros.debugger.active = mode === RunMode.Debug;

        // Setup pre-run
        this.setState(RunState.Loading);
        // Ensure we go back to Loading after finishing any remaining installs
        this.previousState = RunState.Loading;
        BackendManager.publish({
            type: BackendEventType.Start,
            data: "StartClicked", contentType: "text/plain"
        });
        let interrupted = false;
        let terminated = false;
        const backend = await this.backend;
        this.runStartTime = new Date().getTime();
        try {
            await backend.call(backend.workerProxy.runCode, this.code, mode);
        } catch (error: any) {
            if (error.type === "InterruptError") {
                // Error signaling forceful interrupt
                interrupted = true;
                terminated = true;
            } else {
                this.papyros.io.logError(error);
                BackendManager.publish({
                    type: BackendEventType.End,
                    data: "RunError", contentType: "text/plain"
                });
            }
        } finally {
            console.log("Run finished");
            if (this.state === RunState.Stopping) {
                // Was interrupted, End message already published
                interrupted = true;
            }
            if (terminated) {
                await this.launch();
            }
            this.setState(RunState.Ready, this.papyros.i18n.t(
                interrupted ? "Papyros.interrupted" : "Papyros.finished",
                { time: (new Date().getTime() - this.runStartTime) / 1000 }));
            console.log("State set to ready");
        }
    }

    /**
     * Interrupt the currently running code
     * @return {Promise<void>} Returns when the code has been interrupted
     */
    public async stop(): Promise<void> {
        this.setState(RunState.Stopping);
        BackendManager.publish({
            type: BackendEventType.End,
            data: "User cancelled run", contentType: "text/plain"
        });
        const backend = await this.backend;
        await backend.interrupt();

        const startTime = new Date().getTime();
        while (this.state === RunState.Stopping && (new Date().getTime() - startTime) < 5000) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (this.state === RunState.Stopping) {
            console.warn("Deadlock while stopping, restarting backend");
            await this.launch();
            this.setState(RunState.Ready, this.papyros.i18n.t("Papyros.interrupted", { time: (new Date().getTime() - this.runStartTime) / 1000 }));
        }
    }

    public async provideInput(input: string): Promise<void> {
        const backend = await this.backend;
        await backend.writeMessage(input);
        this.setState(RunState.Running);
    }

    public async provideFiles(inlinedFiles: Record<string, string>, hrefFiles: Record<string, string>): Promise<void> {
        const fileNames = [...Object.keys(inlinedFiles), ...Object.keys(hrefFiles)];
        if (fileNames.length === 0) {
            return;
        }
        BackendManager.publish({ type: BackendEventType.Loading, data: JSON.stringify({
            modules: fileNames,
            status: "loading"
        }) });

        const backend = await this.backend;
        await backend.workerProxy.provideFiles(inlinedFiles, hrefFiles);
    }


    /**
     * Show the current state of the program to the user
     * @param {RunState} state The current state of the run
     * @param {string} message Optional message to indicate the state
     */
    public setState(state: RunState, message?: string): void {
        this.stateMessage = message || this.papyros.i18n.t(`Papyros.states.${state}`);
        if (state !== this.state) {
            this.previousState = this.state;
            this.state = state;
        }
    }

    /**
     * Callback to handle loading events
     * @param {BackendEvent} e The loading event
     */
    private onLoad(e: BackendEvent): void {
        const loadingData = parseData(e.data, e.contentType) as LoadingData;
        if (loadingData.status === "loading") {
            loadingData.modules.forEach(m => {
                if (!this.loadingPackages.includes(m)) {
                    this.loadingPackages.push(m);
                }
            });
        } else if (loadingData.status === "loaded") {
            loadingData.modules.forEach(m => {
                const index = this.loadingPackages.indexOf(m);
                if (index !== -1) {
                    this.loadingPackages.splice(index, 1);
                }
            });
        } else { // failed
            // If it is a true module, an Exception will be raised when running
            // So this does not need to be handled here, as it is often an incomplete package-name
            // that causes micropip to not find the correct wheel
            this.loadingPackages = [];
        }
        if (this.loadingPackages.length > 0) {
            const packageMessage = this.papyros.i18n.t("Papyros.loading", {
                // limit amount of package names shown
                packages: this.loadingPackages.slice(0, 3).join(", ")
            });
            this.setState(RunState.Loading, packageMessage);
        } else {
            this.setState(this.previousState);
        }
    }

    private onStart(e: BackendEvent): void {
        if( this.state !== RunState.Loading) {
            // we probably already finished running, this is just a late event so ignore it
            return;
        }

        const startData = parseData(e.data, e.contentType) as string;
        if (startData.includes("RunCode")) {
            this.runStartTime = new Date().getTime();
            this.setState(RunState.Running);
        }
    }

    private updateRunModes(): void {
        this.backend.then(async backend => {
            const proxy = await backend.workerProxy;

            if(proxy) {
                this.runModes = await proxy.runModes(this.code);
            }
        })
    }
}
