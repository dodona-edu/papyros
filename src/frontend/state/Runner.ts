import { SyncClient } from "../../sync/SyncClient";
import { Backend, RunMode, WorkerDiagnostic } from "../../backend/Backend";
import { BackendEvent, BackendEventType } from "../../communication/BackendEvent";
import { arrayBufferToBase64, isTextMimeType, isValidFileName, parseData } from "../../util/Util";
import { State, stateProperty } from "@dodona/lit-state";
import { Papyros } from "./Papyros";
import { ProgrammingLanguage } from "../../ProgrammingLanguage";
import { CODE_TAB, EditorTabId, FileEntry } from "./InputOutput";
import { UnsupportedBrowserError } from "./PapyrosErrors";
import type { Run } from "./PapyrosRuntime";
import { fileNameFromUrl } from "./Files";

/** Where the run of an instance is. A run is in progress, from `Starting` to `Stopping`, exactly while it holds the runtime. */
export enum RunStatus {
    Idle = "idle",
    /** Waiting for its files, the backend and package installs, before the worker starts the code */
    Starting = "starting",
    Running = "running",
    AwaitingInput = "awaiting-input",
    Stopping = "stopping",
    /** A run whose code returned ends once runCode settled and its End or Interrupt event arrived */
    Ended = "ended",
}

/** How a run ended. */
export enum RunOutcome {
    Completed = "completed",
    Stopped = "stopped",
    Crashed = "crashed",
    FilesFailed = "files-failed",
    LaunchFailed = "launch-failed",
}

/** Where the backend is. */
export enum BackendStatus {
    Down = "down",
    Launching = "launching",
    Up = "up",
    Failed = "failed",
}

/** Why the backend cannot run code. */
export enum BackendFailure {
    UnsupportedBrowser = "unsupported-browser",
    InsecureContext = "insecure-context",
    NoServiceWorkerApi = "no-service-worker-api",
    ServiceWorkerError = "service-worker-error",
    Error = "error",
}

/** The run of an instance. Times are in milliseconds. */
export type RunLifecycle =
    | { status: RunStatus.Idle }
    | { status: RunStatus.Starting; mode?: RunMode }
    | { status: RunStatus.Running; mode?: RunMode }
    | { status: RunStatus.AwaitingInput; mode?: RunMode; prompt: string }
    | { status: RunStatus.Stopping; mode?: RunMode }
    /** `mode` is RunMode.Debug only when the debugger was still active at the end */
    | { status: RunStatus.Ended; outcome: RunOutcome; mode?: RunMode; duration: number };

export type BackendLifecycle =
    | { status: BackendStatus.Down }
    | { status: BackendStatus.Launching }
    | { status: BackendStatus.Up }
    | { status: BackendStatus.Failed; reason: BackendFailure };

/** How a run ended, and what the runtime needs afterwards. */
interface RunEnd {
    outcome: RunOutcome;
    /** The worker was terminated under the run, so it has to be launched again */
    terminated?: boolean;
    /** The run left the runtime unable to run or lint anything */
    unusable?: boolean;
}

/** Options for a single run, passed to `Runner.start`. */
export interface RunOptions {
    /**
     * The editor tab to select when the run starts, instead of the code. A host that
     * debugs a failing test passes `HOST_TAB` here to show the test during the run.
     */
    editorTab?: EditorTabId;
    /**
     * When given, the run starts from a workspace that holds only these files. Without
     * them, the workspace is left as is. A promise of them holds the run in `starting`
     * until it settles, and its rejection ends the run before it starts, without
     * reporting an error.
     */
    files?: readonly FileEntry[] | Promise<readonly FileEntry[]>;
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
 * Runs the code of a Papyros instance and tracks its backend and its run lifecycle
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
                this.papyros.reportLaunchFailure(error, "Error launching papyros after a language switch");
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
     * Where the backend is: down, launching, up, or failed and why. Runs started before it is up wait for it.
     */
    @stateProperty
    public backendStatus: BackendLifecycle = { status: BackendStatus.Down };
    /**
     * The run of this instance: in progress, or how the last one ended
     */
    @stateProperty
    public run: RunLifecycle = { status: RunStatus.Idle };
    /**
     * Whether the backend has finished loading and can execute code.
     * Runs may be started before this is true: they wait for the backend.
     */
    public get backendReady(): boolean {
        return this.backendStatus.status === BackendStatus.Up;
    }
    /**
     * Whether the backend is being launched
     */
    public get launching(): boolean {
        return this.backendStatus.status === BackendStatus.Launching;
    }
    /**
     * Identifies the most recent launch, so a superseded one cannot report ready
     */
    private launchId: number = 0;
    /**
     * Array of packages that are being installed
     */
    @stateProperty
    public loadingPackages: Array<string> = [];

    /**
     * Whether this instance has a run in progress
     */
    public get inProgress(): boolean {
        const status = this.run.status;
        return (
            status === RunStatus.Starting ||
            status === RunStatus.Running ||
            status === RunStatus.AwaitingInput ||
            status === RunStatus.Stopping
        );
    }

    /**
     * Whether something is under way: the backend launches, packages are installed or a run is in progress
     */
    public get busy(): boolean {
        return this.launching || this.loadingPackages.length > 0 || this.inProgress;
    }

    /**
     * Whether a run can be started now: this instance has none in progress, and the backend did not fail to load.
     * A run started while the backend launches waits for it.
     */
    public get canStart(): boolean {
        return !this.papyros.runtime.isRunning(this.papyros) && this.backendStatus.status !== BackendStatus.Failed;
    }

    /**
     * What the user is told about the backend and the run
     */
    @stateProperty
    public get statusMessage(): string {
        if (this.loadingPackages.length > 0) {
            return this.papyros.i18n.t("Papyros.loading", {
                // limit amount of package names shown
                packages: this.loadingPackages.slice(0, 3).join(", "),
            });
        }
        const backend = this.backendStatus;
        if (backend.status === BackendStatus.Launching) {
            return this.papyros.i18n.t("Papyros.states.loading");
        }
        if (backend.status === BackendStatus.Failed) {
            switch (backend.reason) {
                case BackendFailure.UnsupportedBrowser:
                    return this.papyros.i18n.t("Papyros.unsupported_browser");
                case BackendFailure.InsecureContext:
                    return this.papyros.i18n.t("Papyros.insecure_context_error");
                case BackendFailure.NoServiceWorkerApi:
                    return this.papyros.i18n.t("Papyros.service_worker_unsupported");
                case BackendFailure.ServiceWorkerError:
                    return this.papyros.i18n.t("Papyros.service_worker_error");
                case BackendFailure.Error:
                    return this.papyros.i18n.t("Papyros.states.error");
            }
        }
        const run = this.run;
        switch (run.status) {
            case RunStatus.Idle:
                return "";
            case RunStatus.Starting:
                return this.papyros.i18n.t("Papyros.states.loading");
            case RunStatus.Running:
                return this.papyros.i18n.t("Papyros.states.running");
            case RunStatus.AwaitingInput:
                return this.papyros.i18n.t("Papyros.states.awaiting_input");
            case RunStatus.Stopping:
                return this.papyros.i18n.t("Papyros.states.stopping");
        }
        const time = run.duration / 1000;
        switch (run.outcome) {
            case RunOutcome.Completed:
                // While debugging, only the trace is finished: the session itself carries on,
                // so "executed" would read as if there were nothing left to do.
                return run.mode === RunMode.Debug
                    ? this.papyros.i18n.t("Papyros.traced", { time })
                    : this.papyros.i18n.t("Papyros.finished", { time });
            case RunOutcome.Stopped:
                return this.papyros.i18n.t("Papyros.interrupted", { time });
            case RunOutcome.Crashed:
                return this.papyros.i18n.t("Papyros.crashed", { time });
            case RunOutcome.FilesFailed:
                return "";
            case RunOutcome.LaunchFailed:
                return this.papyros.i18n.t("Papyros.states.error");
        }
    }
    /**
     * When the run in progress started: when it got the backend, and again when the worker started its code
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
    /**
     * The run of this instance while it waits for its files and the backend, before it
     * hands anything to the worker. Stop ends such a run on the spot.
     */
    private runBeforeWorker: Run | null = null;
    /**
     * The run that `run` describes while it is in progress, so only one call ends it
     */
    private activeRun: Run | null = null;
    /**
     * Settles once the latest run of this instance is done with the worker, before any relaunch
     */
    private execution: Promise<unknown> = Promise.resolve();

    constructor(papyros: Papyros) {
        super();
        this.papyros = papyros;
        // Nothing is launched yet: a rejection every caller handles, instead of an
        // empty object whose methods do not exist
        this.backend = Promise.reject(new Error("No backend has been launched"));
        this.backend.catch(() => undefined);

        this.papyros.events.subscribe(BackendEventType.Input, (e) => this.onInput(e));
        // The runtime hands Loading events to every instance. Installs from outside a run,
        // such as linting, are only shown when no other instance shares the runtime.
        this.papyros.events.subscribe(BackendEventType.Loading, (e) => {
            const ownRun = e.runId !== undefined && e.runId === this.ownRun()?.id;
            if (ownRun || (e.runId === undefined && this.papyros.ownsRuntime)) {
                this.onLoad(e);
            }
        });
        this.papyros.events.subscribe(BackendEventType.Start, (e) => this.onStart(e));
    }

    /**
     * The run of this instance that is in progress, if any
     */
    private ownRun(): Run | null {
        const run = this.papyros.runtime.currentRun;
        return run?.owner === this.papyros ? run : null;
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
        this.backendStatus = { status: BackendStatus.Down };
    }

    /**
     * Stops any run, including one that is still loading, leaves debug mode and clears the output:
     * the instance shows what a fresh one shows.
     * @return {Promise<void>} Returns when the program has been reset
     */
    public async reset(): Promise<void> {
        if (this.inProgress) {
            await this.stop();
        }

        this.papyros.debugger.active = false;
        if (!this.inProgress) {
            this.run = { status: RunStatus.Idle };
            this.papyros.io.reset();
        }
    }

    /**
     * Start the backend to enable running code.
     *
     * Resolves once the backend can run code and rejects when it fails to start, with an
     * UnsupportedBrowserError when this browser cannot run the runtime at all. Resolves
     * quietly when the runner is disposed during the launch. Awaiting this waits for the
     * whole runtime to download. `backendStatus` is launching until then. `backend` is
     * assigned before that, so a caller that does not await can already start a run, which
     * waits for the backend.
     */
    public async launch(): Promise<void> {
        if (this.disposed) {
            // Terminating a worker mid-run fails that run as interrupted, which
            // would relaunch the worker here and leak what dispose() just released
            return;
        }
        this.backendStatus = { status: BackendStatus.Launching };
        const launchId = ++this.launchId;
        const language = this.programmingLanguage;
        const backendLaunched = this.launchBackend(language, launchId);
        this.backend = backendLaunched;
        try {
            await backendLaunched;
        } catch (error) {
            if (this.disposed) {
                // Disposing a private runtime terminates the worker mid-boot, which fails the launch
                return;
            }
            if (launchId === this.launchId) {
                this.backendStatus = {
                    status: BackendStatus.Failed,
                    reason:
                        error instanceof UnsupportedBrowserError
                            ? BackendFailure.UnsupportedBrowser
                            : BackendFailure.Error,
                };
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
        await this.writeFiles(await this.backend, files);
    }

    private async writeFiles(backend: SyncClient<Backend>, files: readonly FileEntry[]): Promise<void> {
        for (const file of files) {
            await backend.workerProxy.updateFile(file.name, file.content, file.binary);
        }
    }

    private async launchBackend(language: ProgrammingLanguage, launchId: number): Promise<SyncClient<Backend>> {
        const backend = await this.papyros.runtime.ready(language);
        if (launchId === this.launchId) {
            this.updateRunModes();
            this.backendStatus = { status: BackendStatus.Up };
        }
        return backend;
    }

    /**
     * Execute the code in the editor
     * @param {RunMode} mode The mode to run with
     * @param {RunOptions} options Options for this run
     * @return {Promise<void>} Promise of running the code. Resolves without running anything
     * while another run on the same runtime is in progress.
     */
    public async start(mode?: RunMode, options: RunOptions = {}): Promise<void> {
        // Claimed before anything else is touched, so a refused start leaves this instance as it was
        const run = this.papyros.runtime.tryAcquire(this.papyros);
        if (!run) {
            return;
        }
        this.activeRun = run;
        this.runStartTime = new Date().getTime();
        this.run = { status: RunStatus.Starting, mode };
        const execution = this.execute(run, mode, options);
        this.execution = execution;
        let end: RunEnd = { outcome: RunOutcome.Crashed };
        try {
            end = await execution;
        } finally {
            this.endRun(run, end.outcome);
        }
        if (end.unusable) {
            await this.recoverRuntime();
        } else if (end.terminated) {
            await this.launch();
        }
    }

    /**
     * End the given run of this instance and release the runtime. Only the first call for a run does anything.
     */
    private endRun(run: Run, outcome: RunOutcome): void {
        if (this.activeRun !== run) {
            return;
        }
        this.activeRun = null;
        this.runBeforeWorker = null;
        // The matching "loaded" events of an interrupted install never come
        if (this.papyros.runtime.release(run) && this.loadingPackages.length > 0) {
            this.loadingPackages = [];
        }
        let mode = "mode" in this.run ? this.run.mode : undefined;
        if (mode === RunMode.Debug && !this.papyros.debugger.active) {
            // A debug run that took no step left debug mode on its End event
            mode = RunMode.Run;
        }
        this.run = { status: RunStatus.Ended, outcome, mode, duration: new Date().getTime() - this.runStartTime };
        this.papyros.io.onRunEnd();
        // A worker that was replaced never reports the end of the stopped run
        this.papyros.debugger.onRunOver();
    }

    private async execute(run: Run, mode: RunMode | undefined, options: RunOptions): Promise<RunEnd> {
        this.papyros.debugger.active = mode === RunMode.Debug;
        this.papyros.io.reset(options.editorTab ?? CODE_TAB);
        this.papyros.debugger.onRunStart();
        const runtime = this.papyros.runtime;
        this.runBeforeWorker = run;
        let files: readonly FileEntry[] | undefined;
        let filesFailed = false;
        try {
            files = await options.files;
        } catch {
            filesFailed = true;
        }
        const backend = filesFailed ? undefined : await this.availableBackend();
        if (runtime.currentRun !== run) {
            // Stopped or disposed while it waited
            return { outcome: RunOutcome.Stopped };
        }
        this.runBeforeWorker = null;
        if (filesFailed) {
            // Whoever loads the files reports why they failed
            return { outcome: RunOutcome.FilesFailed };
        }
        if (!backend) {
            return { outcome: RunOutcome.LaunchFailed };
        }
        this.runStartTime = new Date().getTime();
        try {
            if (files) {
                // A recovery would otherwise replay the files an earlier provideFiles handed over
                this.providedFiles = undefined;
                await backend.workerProxy.clearWorkspace();
                await this.writeFiles(backend, files);
            }
            // Disposing this instance while the files were written ends its run, and another
            // instance may be using the worker by now
            if (this.run.status !== RunStatus.Stopping && runtime.currentRun === run) {
                const over = this.runOver(run);
                // An injected test double has no worker to terminate
                const terminated: Promise<never> = backend.terminated ?? new Promise(() => undefined);
                try {
                    await backend.call(
                        backend.workerProxy.runCode,
                        this.effectiveCode,
                        mode,
                        this.papyros.constants.maxDebugFrames,
                        run.id,
                    );
                    // The worker's last events travel over the event proxy, and can land after runCode settled
                    const arrived = await Promise.race([over.arrived, terminated.catch(() => false)]);
                    if (!arrived) {
                        return { outcome: RunOutcome.Stopped, terminated: true };
                    }
                } finally {
                    over.unsubscribe();
                }
            }
        } catch (error: any) {
            if (error.type === "InterruptError") {
                // Error signaling forceful interrupt
                return { outcome: RunOutcome.Stopped, terminated: true };
            }
            this.papyros.io.logError(error);
            return {
                outcome: this.run.status === RunStatus.Stopping ? RunOutcome.Stopped : RunOutcome.Crashed,
                unusable: isRuntimeUnusable(error),
            };
        }
        return { outcome: this.run.status === RunStatus.Stopping ? RunOutcome.Stopped : RunOutcome.Completed };
    }

    /**
     * Resolves to true once the worker sent the last event of the given run: End, or Interrupt
     * when it stopped. Resolves to false when stop() gave up on the run first.
     */
    private runOver(run: Run): { arrived: Promise<boolean>; unsubscribe: () => void } {
        let settle!: (arrived: boolean) => void;
        const arrived = new Promise<boolean>((resolve) => (settle = resolve));
        const unsubscribers = [
            ...[BackendEventType.End, BackendEventType.Interrupt].map((type) =>
                this.papyros.events.subscribe(type, (e) => {
                    if (e.runId === run.id) {
                        settle(true);
                    }
                }),
            ),
            this.subscribe(() => {
                if (this.activeRun !== run) {
                    settle(false);
                }
            }, "run"),
        ];
        return { arrived, unsubscribe: () => unsubscribers.forEach((unsubscribe) => unsubscribe()) };
    }

    /**
     * Interrupt the run of this instance. Does nothing when it has none in progress.
     * @return {Promise<void>} Returns when the code has been interrupted
     */
    public async stop(): Promise<void> {
        const runtime = this.papyros.runtime;
        const run = this.ownRun();
        const current = this.run;
        if (!run || current.status === RunStatus.Idle || current.status === RunStatus.Ended) {
            return;
        }
        if (this.runBeforeWorker === run) {
            // Nothing runs in the worker yet, and the run ignores its files when they arrive
            this.endRun(run, RunOutcome.Stopped);
            return;
        }
        this.run = { status: RunStatus.Stopping, mode: current.mode };
        this.papyros.debugger.onRunEnd();
        const backend = await this.availableBackend();
        // Without a backend, or once another instance started a run while the backend was
        // awaited, there is nothing of ours to interrupt: the run ends when it settles
        if (!backend || runtime.currentRun !== run) {
            return;
        }
        await backend.interrupt();

        let timer: ReturnType<typeof setTimeout> | undefined;
        const deadlocked = await Promise.race([
            this.execution.then(
                () => false,
                () => false,
            ),
            new Promise<boolean>((resolve) => (timer = setTimeout(() => resolve(true), 5000))),
        ]);
        clearTimeout(timer);
        if (deadlocked) {
            console.warn("Deadlock while stopping, restarting backend");
            if (runtime.currentRun === run) {
                // launch() keeps a worker that is already up, so the stuck run would never settle
                runtime.restartWorker(this.programmingLanguage);
            }
            this.endRun(run, RunOutcome.Stopped);
            await this.launch();
        }
    }

    public async provideInput(input: string): Promise<void> {
        const run = this.ownRun();
        if (!run) {
            return;
        }
        if (this.run.status === RunStatus.AwaitingInput) {
            this.run = { status: RunStatus.Running, mode: this.run.mode };
        }
        const backend = await this.availableBackend();
        // Input submitted as a run ends has no reader left to receive it, and another
        // run may have started while the backend was awaited
        if (!backend || backend.state === "idle" || this.papyros.runtime.currentRun !== run) {
            return;
        }
        await backend.writeMessage(input).catch((error) => {
            // The run can also end while the write waits for the worker to start reading
            if (backend.state !== "idle") {
                throw error;
            }
        });
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
        // Without its trailing slashes, a URL of a directory is named after that directory
        const trimmed = new URL(url);
        trimmed.pathname = trimmed.pathname.replace(/\/+$/, "");
        const candidate = fileNameFromUrl(trimmed.href);
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
        // On a shared runtime, the worker's own "loaded" events leave loadingPackages alone
        report("loaded");
    }

    /**
     * Callback to handle loading events
     * @param {BackendEvent} e The loading event
     */
    private onLoad(e: BackendEvent): void {
        const loadingData = parseData(e.data, e.contentType) as LoadingData;
        // Reassigned rather than mutated, so subscribers notice the change
        if (loadingData.status === "loading") {
            const added = loadingData.modules.filter((m) => !this.loadingPackages.includes(m));
            if (added.length > 0) {
                this.loadingPackages = [...this.loadingPackages, ...added];
            }
        } else if (loadingData.status === "loaded") {
            if (loadingData.modules.some((m) => this.loadingPackages.includes(m))) {
                this.loadingPackages = this.loadingPackages.filter((m) => !loadingData.modules.includes(m));
            }
        } else if (this.loadingPackages.length > 0) {
            // failed
            // If it is a true module, an Exception will be raised when running
            // So this does not need to be handled here, as it is often an incomplete package-name
            // that causes micropip to not find the correct wheel
            this.loadingPackages = [];
        }
    }

    private onStart(e: BackendEvent): void {
        const startData = parseData(e.data, e.contentType) as string;
        if (startData.includes("RunCode") && this.run.status === RunStatus.Starting) {
            this.runStartTime = new Date().getTime();
            this.run = { status: RunStatus.Running, mode: this.run.mode };
        }
    }

    /**
     * An input request of the run in progress: answered from the batch input when it holds
     * a line, put to the user otherwise. A stopped run can still send one after its prompt closed.
     */
    private onInput(e: BackendEvent): void {
        if (this.run.status !== RunStatus.Running || this.papyros.io.provideBufferedInput()) {
            return;
        }
        this.run = { status: RunStatus.AwaitingInput, mode: this.run.mode, prompt: String(e.data ?? "") };
    }

    private updateRunModes(): void {
        // Launch failures surface through launch(), so only they are swallowed here
        void this.backend
            .catch(() => undefined)
            .then(async (backend) => {
                const proxy = backend?.workerProxy;

                if (proxy) {
                    this.runModes = await proxy.runModes(this.effectiveCode);
                }
            });
    }
}
