import { SyncClient } from "../../sync/SyncClient";
import { Backend, RunMode, WorkerDiagnostic } from "../../backend/Backend";
import { BackendEvent, BackendEventType } from "../../communication/BackendEvent";
import { arrayBufferToBase64, isTextMimeType, isValidFileName, parseData } from "../../util/Util";
import { State, stateProperty } from "@dodona/lit-state";
import { Papyros } from "./Papyros";
import { ProgrammingLanguage } from "../../ProgrammingLanguage";
import { PapyrosLaunchError } from "./PapyrosErrors";
import { FileEntry } from "./InputOutput";

/**
 * Enum representing the possible states while processing code
 */
export enum RunState {
    Loading = "loading",
    Running = "running",
    AwaitingInput = "awaiting_input",
    Stopping = "stopping",
    Ready = "ready",
    Error = "error",
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
 * Signatures of errors that leave the runtime unable to run or lint anything
 * afterwards: its heap is exhausted, a trap aborted it, or Pyodide already
 * declared it dead after a trap that surfaced elsewhere. The WebAssembly heap
 * only ever grows, so nothing short of a fresh worker recovers from these.
 * Trap wording differs per engine (V8, JavaScriptCore, SpiderMonkey).
 */
const UNUSABLE_RUNTIME_SIGNATURES = [
    "memoryerror",
    "out of bounds memory access",
    "memory access out of bounds",
    "index out of bounds",
    "could not allocate memory",
    "call_indirect to a null table entry",
    "call_indirect to a signature that does not match",
    "null function",
    "indirect call to null",
    "indirect call signature mismatch",
    "aborted(",
    "pyodide already fatally failed",
    "pyodide already exited",
];

function isRuntimeUnusable(error: any): boolean {
    const description = `${error?.type ?? ""} ${error?.message ?? error ?? ""}`.toLowerCase();
    return UNUSABLE_RUNTIME_SIGNATURES.some((signature) => description.includes(signature));
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
    public get programmingLanguage(): ProgrammingLanguage {
        return this._programmingLanguage;
    }
    public set programmingLanguage(value: ProgrammingLanguage) {
        if (this._programmingLanguage !== value) {
            this._programmingLanguage = value;
            const launching = this.launch();
            // launch() claims its id synchronously, so a newer id means a later launch
            // superseded this one and its failure no longer concerns the user
            const launchId = this.launchId;
            launching.catch((error) => {
                if (launchId !== this.launchId) {
                    return;
                }
                this.papyros.errorHandler(
                    new PapyrosLaunchError("Error launching papyros after a language switch", { cause: error }),
                );
            });
        }
    }

    /** @see PapyrosRuntime.pyodideAssetURL */
    public get pyodideAssetURL(): string | undefined {
        return this.papyros.runtime.pyodideAssetURL;
    }
    public set pyodideAssetURL(value: string | undefined) {
        this.papyros.runtime.pyodideAssetURL = value;
    }

    /** @see PapyrosRuntime.allowJspi */
    public get allowJspi(): boolean {
        return this.papyros.runtime.allowJspi;
    }
    public set allowJspi(value: boolean) {
        this.papyros.runtime.allowJspi = value;
    }

    /**
     * The backend that executes the code asynchronously
     */
    @stateProperty
    public backend: Promise<SyncClient<Backend>>;
    /**
     * Whether the backend has finished loading and can execute code.
     * Runs may be started before this is true: they are queued until the
     * backend is up, so the run state is Ready while it is still loading.
     */
    @stateProperty
    public backendReady: boolean = false;
    /**
     * Identifies the most recent launch, so a superseded one cannot report ready
     */
    private launchId: number = 0;
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

    static CODE_SEPARATOR = "\n\n";

    @stateProperty
    public get effectiveCode(): string {
        let result = this.code;
        if (this.papyros.test.testCode !== undefined) {
            result += `${Runner.CODE_SEPARATOR}${this.papyros.test.testCode}`;
        }
        return result;
    }

    public set effectiveCode(value: string) {
        let codeWithoutTest = value;
        if (this.papyros.test.testCode !== undefined) {
            codeWithoutTest = codeWithoutTest.slice(
                0,
                -(Runner.CODE_SEPARATOR.length + this.papyros.test.testCode.length),
            );
        }
        this.code = codeWithoutTest;
    }

    /**
     * Async getter for the linting diagnostics of the current code
     */
    public async lintSource(): Promise<WorkerDiagnostic[]> {
        // A lint cannot recover from a failed launch: retrying the launch on every
        // edit would loop on a runtime that fails to boot
        const backend = await this.availableBackend();
        const proxy = backend?.workerProxy;

        if (!proxy) {
            return [];
        }
        try {
            return await proxy.lintCode(this.code);
        } catch (error: any) {
            // The editor lints in the background on every edit, and CodeMirror turns a
            // rejected linter into an uncaught window error. Report it and show no
            // diagnostics instead.
            this.papyros.errorHandler(error);
            if (isRuntimeUnusable(error)) {
                await this.recoverRuntime();
            }
            return [];
        }
    }

    /**
     * The backend once it is up, or undefined when none was launched or the launch
     * failed. Launch failures are reported by launch() itself, so callers can treat
     * both the same way.
     */
    private async availableBackend(): Promise<SyncClient<Backend> | undefined> {
        try {
            await this.backend;
            // Another instance on a shared runtime may have replaced the worker since
            return await this.papyros.runtime.ready(this.programmingLanguage);
        } catch {
            return undefined;
        }
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

    /**
     * Whether dispose() ran. Disposing during an active run makes that run fail as
     * interrupted, which normally relaunches the worker; this suppresses it.
     */
    private disposed: boolean = false;
    /**
     * The files last handed over through provideFiles, replayed into a replacement
     * runtime. Files over 1 MB never reach io.files, so they cannot be restored
     * from there.
     */
    private providedFiles?: [Record<string, string>, Record<string, string>];

    constructor(papyros: Papyros) {
        super();
        this.papyros = papyros;
        // Nothing is launched yet: a rejection every caller handles, instead of an
        // empty object whose methods do not exist
        this.backend = Promise.reject(new Error("No backend has been launched"));
        this.backend.catch(() => undefined);

        this.papyros.events.subscribe(BackendEventType.Input, () => this.setState(RunState.AwaitingInput));
        this.papyros.events.subscribe(BackendEventType.Loading, (e) => {
            // Packages installed for another instance's run say nothing about this one
            if (!this.papyros.runtime.isBusyFor(this.papyros)) {
                this.onLoad(e);
            }
        });
        this.papyros.events.subscribe(BackendEventType.Start, (e) => this.onStart(e));
        this.papyros.events.subscribe(BackendEventType.End, (e) => this.onEnd(e));
    }

    /** @see PapyrosRuntime.registerBackend */
    public registerBackend(language: ProgrammingLanguage, backendCreator: () => SyncClient<Backend>): void {
        this.papyros.runtime.registerBackend(language, backendCreator);
    }

    /**
     * Abandon in flight launches. The runner cannot launch again afterwards.
     */
    public dispose(): void {
        this.disposed = true;
        this.launchId++;
        this.backendReady = false;
    }

    /**
     * Stops the current run and resets the state of the program
     * Regular and debug output is cleared
     * @return {Promise<void>} Returns when the program has been reset
     */
    public async reset(): Promise<void> {
        if (![RunState.Ready, RunState.Loading, RunState.Error].includes(this.state)) {
            await this.stop();
        }

        this.papyros.debugger.active = false;
    }

    /**
     * Start the backend to enable running code.
     *
     * Resolves once the backend can run code and rejects when it fails to start, so
     * awaiting this waits for the whole runtime to download. `backend` is assigned
     * before that, so a caller that does not await can already queue runs.
     */
    public async launch(): Promise<void> {
        if (this.disposed) {
            // Terminating a worker mid-run fails that run as interrupted, which
            // would relaunch the worker here and leak what dispose() just released
            return;
        }
        this.setState(RunState.Loading);
        this.backendReady = false;
        const launchId = ++this.launchId;
        const language = this.programmingLanguage;
        const backendLaunched = this.launchBackend(language, launchId);
        this.backend = backendLaunched;
        this.setState(RunState.Ready);
        try {
            await backendLaunched;
        } catch (error) {
            if (launchId === this.launchId) {
                this.setState(RunState.Error);
            }
            throw error;
        }
    }

    /**
     * Resolves at once when the backend is up, and otherwise launches it. Rejects when
     * the launch fails, without the alert or confirm of Papyros.launch(), so the caller
     * decides how to report it and a later call retries.
     */
    public async ensureLaunched(): Promise<void> {
        if (!this.backendReady) {
            await this.launch();
        }
    }

    /**
     * Replace a runtime that can no longer run or lint code, and on a private runtime
     * put the files it held back into the fresh one. A shared runtime is left empty:
     * each run there writes the files it needs itself.
     */
    private async recoverRuntime(): Promise<void> {
        if (this.disposed) {
            return;
        }
        try {
            const recovered = await this.papyros.runtime.recover(this.programmingLanguage, this.papyros);
            if (recovered && this.papyros.ownsRuntime) {
                await this.restoreWorkspace();
            }
        } catch (error: any) {
            this.papyros.errorHandler(error);
        }
    }

    /**
     * Write the files back into a freshly started worker, which comes up with an
     * empty filesystem while the editor still shows them.
     */
    private async restoreWorkspace(): Promise<void> {
        // Snapshot first: replaying the provided files refreshes io.files from the
        // worker, and the editor's copy of a file edited since must win
        const files = this.papyros.io.files;
        if (this.providedFiles) {
            await this.provideFiles(...this.providedFiles);
        }
        if (files.length === 0) {
            return;
        }
        const backend = await this.backend;
        for (const file of files) {
            await backend.workerProxy.updateFile(file.name, file.content, file.binary);
        }
    }

    private async launchBackend(language: ProgrammingLanguage, launchId: number): Promise<SyncClient<Backend>> {
        const backend = await this.papyros.runtime.ready(language);
        if (launchId === this.launchId) {
            this.updateRunModes();
            this.backendReady = true;
        }
        return backend;
    }

    /**
     * Execute the code in the editor
     * @param {RunMode} mode The mode to run with
     * @param {FileEntry[]} files When given, the run starts from a workspace that holds only these files.
     * Without them, the workspace is left as is.
     * @return {Promise<void>} Promise of running the code. Resolves without running anything
     * while another run on the same runtime is in progress.
     */
    public async start(mode?: RunMode, files?: readonly FileEntry[]): Promise<void> {
        // Claimed before anything else is touched, so a refused start leaves this instance as it was
        if (!this.papyros.runtime.tryAcquire(this.papyros)) {
            return;
        }
        try {
            await this.run(mode, files);
        } finally {
            this.papyros.runtime.release(this.papyros);
        }
    }

    private async run(mode?: RunMode, files?: readonly FileEntry[]): Promise<void> {
        this.papyros.debugger.active = mode === RunMode.Debug;

        // Setup pre-run
        this.setState(RunState.Loading);
        // Ensure we go back to Loading after finishing any remaining installs
        this.previousState = RunState.Loading;
        this.papyros.io.reset();
        this.papyros.debugger.onRunStart();
        let interrupted = false;
        let terminated = false;
        let unusable = false;
        const backend = await this.availableBackend();
        if (!backend) {
            // Leaving the debugger active would offer a stop-debug button here
            this.papyros.debugger.active = false;
            this.papyros.io.onRunEnd();
            this.papyros.debugger.onRunEnd();
            this.setState(RunState.Error);
            return;
        }
        this.runStartTime = new Date().getTime();
        try {
            if (files) {
                // A recovery would otherwise replay the files an earlier provideFiles handed over
                this.providedFiles = undefined;
                await backend.workerProxy.clearWorkspace();
                for (const file of files) {
                    await backend.workerProxy.updateFile(file.name, file.content, file.binary);
                }
            }
            if (this.state !== RunState.Stopping) {
                await backend.call(
                    backend.workerProxy.runCode,
                    this.effectiveCode,
                    mode,
                    this.papyros.constants.maxDebugFrames,
                );
            }
        } catch (error: any) {
            if (error.type === "InterruptError") {
                // Error signaling forceful interrupt
                interrupted = true;
                terminated = true;
            } else {
                this.papyros.io.logError(error);
                this.papyros.io.onRunEnd();
                this.papyros.debugger.onRunEnd();
                this.onFinished();
                unusable = isRuntimeUnusable(error);
            }
        } finally {
            if (this.state === RunState.Stopping) {
                // stop() already closed the input prompt and flushed the debugger
                interrupted = true;
            }
            if (unusable) {
                await this.recoverRuntime();
            } else if (terminated) {
                await this.launch();
            }
            if (interrupted || terminated) {
                this.setState(
                    RunState.Ready,
                    this.papyros.i18n.t("Papyros.interrupted", {
                        time: (new Date().getTime() - this.runStartTime) / 1000,
                    }),
                );
            }
        }
    }

    /**
     * Interrupt the currently running code. Does nothing while another instance
     * sharing the runtime is running.
     * @return {Promise<void>} Returns when the code has been interrupted
     */
    public async stop(): Promise<void> {
        const runtime = this.papyros.runtime;
        if (runtime.isBusyFor(this.papyros)) {
            return;
        }
        this.setState(RunState.Stopping);
        this.papyros.io.onRunEnd();
        this.papyros.debugger.onRunEnd();
        const backend = await this.availableBackend();
        if (!backend) {
            this.setState(RunState.Error);
            return;
        }
        await backend.interrupt();

        const startTime = new Date().getTime();
        while (this.state === RunState.Stopping && new Date().getTime() - startTime < 5000) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        if (this.state === RunState.Stopping) {
            console.warn("Deadlock while stopping, restarting backend");
            if (runtime.running === this.papyros) {
                // launch() keeps a worker that is already up, so the stuck run would never settle
                runtime.restartWorker(this.programmingLanguage);
                runtime.release(this.papyros);
            }
            await this.launch();
            this.setState(
                RunState.Ready,
                this.papyros.i18n.t("Papyros.interrupted", { time: (new Date().getTime() - this.runStartTime) / 1000 }),
            );
        }
    }

    public async provideInput(input: string): Promise<void> {
        if (!this.papyros.runtime.isRunning(this.papyros)) {
            return;
        }
        const backend = await this.availableBackend();
        if (!backend) {
            return;
        }
        this.setState(RunState.Running);
        await backend.writeMessage(input);
    }

    public async deleteFile(name: string): Promise<void> {
        const backend = await this.availableBackend();
        await backend?.workerProxy.deleteFile(name);
    }

    public async updateFile(name: string, content: string, binary: boolean): Promise<void> {
        const backend = await this.availableBackend();
        await backend?.workerProxy.updateFile(name, content, binary);
    }

    public async renameFile(oldName: string, newName: string): Promise<void> {
        const backend = await this.availableBackend();
        await backend?.workerProxy.renameFile(oldName, newName);
    }

    public upsertFile(name: string, content: string, binary: boolean): void {
        this.papyros.io.upsertFile(name, content, binary);
        void this.updateFile(name, content, binary);
    }

    public async fetchAndAddUrl(rawUrl: string): Promise<void> {
        try {
            const url = new URL(rawUrl);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} ${response.statusText}`);
            }
            const name = this.filenameFromUrl(url);
            const contentType = response.headers.get("Content-Type");
            if (isTextMimeType(contentType)) {
                this.upsertFile(name, await response.text(), false);
            } else {
                this.upsertFile(name, arrayBufferToBase64(await response.arrayBuffer()), true);
            }
        } catch (err) {
            console.warn("Failed to fetch dropped URL:", rawUrl, err);
            alert(this.papyros.i18n.t("Papyros.url_fetch_error", { url: rawUrl }));
        }
    }

    private filenameFromUrl(url: URL): string {
        const segments = url.pathname.split("/").filter((s) => s.length > 0);
        let candidate = segments[segments.length - 1] ?? "";
        try {
            candidate = decodeURIComponent(candidate);
        } catch {
            // Leave as-is if decoding fails
        }
        if (isValidFileName(candidate)) return candidate;
        if (isValidFileName(url.hostname)) return url.hostname;
        return "download";
    }

    public async provideFiles(inlinedFiles: Record<string, string>, hrefFiles: Record<string, string>): Promise<void> {
        const fileNames = [...Object.keys(inlinedFiles), ...Object.keys(hrefFiles)];
        if (fileNames.length === 0) {
            return;
        }
        this.providedFiles = [inlinedFiles, hrefFiles];
        // parseData hands application/json data over as-is, so it must be the object
        const report = (status: LoadingData["status"]): void =>
            this.onLoad({
                type: BackendEventType.Loading,
                data: { modules: fileNames, status },
                contentType: "application/json",
            });
        report("loading");

        const backend = await this.availableBackend();
        if (!backend) {
            report("failed");
            return;
        }
        try {
            await backend.workerProxy.provideFiles(inlinedFiles, hrefFiles);
        } catch (error) {
            // Nothing else reports these files as loaded, so the runner would stay
            // loading forever behind a stop button that has nothing to stop
            report("failed");
            throw error;
        }
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
            loadingData.modules.forEach((m) => {
                if (!this.loadingPackages.includes(m)) {
                    this.loadingPackages.push(m);
                }
            });
        } else if (loadingData.status === "loaded") {
            loadingData.modules.forEach((m) => {
                const index = this.loadingPackages.indexOf(m);
                if (index !== -1) {
                    this.loadingPackages.splice(index, 1);
                }
            });
        } else {
            // failed
            // If it is a true module, an Exception will be raised when running
            // So this does not need to be handled here, as it is often an incomplete package-name
            // that causes micropip to not find the correct wheel
            this.loadingPackages = [];
        }
        if (this.loadingPackages.length > 0) {
            const packageMessage = this.papyros.i18n.t("Papyros.loading", {
                // limit amount of package names shown
                packages: this.loadingPackages.slice(0, 3).join(", "),
            });
            this.setState(RunState.Loading, packageMessage);
        } else {
            this.setState(this.previousState);
        }
    }

    private onStart(e: BackendEvent): void {
        const startData = parseData(e.data, e.contentType) as string;
        if (startData.includes("RunCode")) {
            this.runStartTime = new Date().getTime();
            this.setState(RunState.Running);
        }
    }

    private onEnd(e: BackendEvent): void {
        const endData = parseData(e.data, e.contentType) as string;
        if (endData.includes("CodeFinished")) {
            this.onFinished();
        }
    }

    /**
     * The run is over, whether the program completed or raised: the worker
     * sends an end event either way, error events only carry output
     */
    private onFinished(): void {
        const time = (new Date().getTime() - this.runStartTime) / 1000;
        // While debugging, only the trace is finished: the session itself carries on,
        // so "executed" would read as if there were nothing left to do.
        this.setState(
            RunState.Ready,
            this.papyros.debugger.active
                ? this.papyros.i18n.t("Papyros.traced", { time })
                : this.papyros.i18n.t("Papyros.finished", { time }),
        );
    }
    private updateRunModes(): void {
        // Launch failures surface through launch(), so only they are swallowed here
        this.backend
            .catch(() => undefined)
            .then(async (backend) => {
                const proxy = backend?.workerProxy;

                if (proxy) {
                    this.runModes = await proxy.runModes(this.effectiveCode);
                }
            });
    }
}
