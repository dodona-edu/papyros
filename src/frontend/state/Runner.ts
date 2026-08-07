import { proxy } from "comlink";
import { SyncClient } from "../../sync/SyncClient";
import { Backend, RunMode, WorkerDiagnostic } from "../../backend/Backend";
import { BackendEvent, BackendEventType } from "../../communication/BackendEvent";
import { BackendManager } from "../../communication/BackendManager";
import { arrayBufferToBase64, isTextMimeType, isValidFileName, parseData } from "../../util/Util";
import { State, stateProperty } from "@dodona/lit-state";
import { Papyros } from "./Papyros";
import { ProgrammingLanguage } from "../../ProgrammingLanguage";

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
            this.launch();
        }
    }

    @stateProperty
    pyodideAssetURL: string | undefined = undefined;

    /**
     * Whether Python may use JSPI stack switching for input and sleep where the browser
     * supports it. Set to false to force the service worker or SharedArrayBuffer channel,
     * for instance to work around a browser whose stack switching misbehaves.
     */
    @stateProperty
    allowJspi: boolean = true;

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
        const backend = await this.backend;
        const proxy = backend.workerProxy;

        if (!proxy) {
            return [];
        }
        return await proxy.lintCode(this.code);
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
     * The live backend client per language, owned by this instance
     */
    private clients: Map<ProgrammingLanguage, SyncClient<Backend>> = new Map();
    /**
     * Per-instance factory overrides, so tests can inject a backend without
     * touching the static registry shared by every instance
     */
    private backendCreators: Map<ProgrammingLanguage, () => SyncClient<Backend>> = new Map();
    /**
     * Tracks which workers have completed their launch call, so relaunching a live
     * client is free. Keyed by the Worker itself: an interrupt that replaces the
     * worker automatically invalidates the entry.
     */
    private launched: WeakMap<object, Promise<void>> = new WeakMap();

    constructor(papyros: Papyros) {
        super();
        this.papyros = papyros;
        this.backend = Promise.resolve({} as SyncClient<Backend>);

        this.papyros.events.subscribe(BackendEventType.Input, () => this.setState(RunState.AwaitingInput));
        this.papyros.events.subscribe(BackendEventType.Loading, (e) => this.onLoad(e));
        this.papyros.events.subscribe(BackendEventType.Start, (e) => this.onStart(e));
        this.papyros.events.subscribe(BackendEventType.End, (e) => this.onEnd(e));
        this.papyros.events.subscribe(BackendEventType.Error, () => this.onError());
    }

    /**
     * Use a custom backend for the given language on this instance only
     * @param {ProgrammingLanguage} language The language to override
     * @param {Function} backendCreator The constructor for a SyncClient
     */
    public registerBackend(language: ProgrammingLanguage, backendCreator: () => SyncClient<Backend>): void {
        this.backendCreators.set(language, backendCreator);
        this.clients.delete(language);
    }

    private getClient(language: ProgrammingLanguage): SyncClient<Backend> {
        let client = this.clients.get(language);
        if (!client) {
            const create = this.backendCreators.get(language);
            client = create ? create() : BackendManager.createBackend(language);
            this.clients.set(language, client);
        }
        return client;
    }

    /**
     * Terminate every worker this instance started and abandon in flight launches
     */
    public dispose(): void {
        this.launchId++;
        this.backendReady = false;
        for (const client of this.clients.values()) {
            try {
                client.terminate();
            } catch {
                // An injected or never-started client has no worker to terminate
            }
        }
        this.clients.clear();
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
        this.backendReady = false;
        const launchId = ++this.launchId;
        const backend = this.getClient(this.programmingLanguage);
        // Expose the promise before it settles so runs can already be queued while downloading
        const backendLaunched = this.launchBackend(backend, launchId);
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

    private async launchBackend(backend: SyncClient<Backend>, launchId: number): Promise<SyncClient<Backend>> {
        // An injected test double has no worker, so fall back to keying on the client
        const worker: object = backend.worker ?? backend;
        let launched = this.launched.get(worker);
        if (!launched) {
            // Allow passing messages between worker and main thread
            launched = backend.workerProxy
                .launch(
                    proxy((e: BackendEvent) => this.papyros.events.publish(e)),
                    this.pyodideAssetURL,
                    this.allowJspi,
                )
                .then(async () => {
                    backend.usesPromiseTransport = await backend.workerProxy.usesJspi();
                });
            this.launched.set(worker, launched);
        }
        try {
            await launched;
        } catch (error) {
            // Let a retry attempt the launch again instead of replaying this failure
            this.launched.delete(worker);
            throw error;
        }
        if (!backend.usesPromiseTransport) {
            // This backend blocks on the channel, so it needs one to exist before it runs.
            // Registration may not have happened yet: Papyros defers it when the browser
            // can suspend the wasm stack, since Python then never touches it.
            // A failure here is reported by ensureChannel and leaves the channel null, so
            // running code still works and only reading input fails.
            await this.papyros.ensureChannel();
        }
        // Assign either way, so a client that switched to JSPI drops a channel it no longer uses
        backend.channel = this.papyros.channel;
        if (launchId === this.launchId) {
            this.updateRunModes();
            this.backendReady = true;
        }
        return backend;
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
        this.papyros.io.reset();
        this.papyros.debugger.onRunStart();
        let interrupted = false;
        let terminated = false;
        const backend = await this.backend;
        this.runStartTime = new Date().getTime();
        try {
            await backend.call(
                backend.workerProxy.runCode,
                this.effectiveCode,
                mode,
                this.papyros.constants.maxDebugFrames,
            );
        } catch (error: any) {
            if (error.type === "InterruptError") {
                // Error signaling forceful interrupt
                interrupted = true;
                terminated = true;
            } else {
                this.papyros.io.logError(error);
                this.papyros.io.onRunEnd();
                this.papyros.debugger.onRunEnd();
            }
        } finally {
            if (this.state === RunState.Stopping) {
                // stop() already closed the input prompt and flushed the debugger
                interrupted = true;
            }
            if (terminated) {
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
     * Interrupt the currently running code
     * @return {Promise<void>} Returns when the code has been interrupted
     */
    public async stop(): Promise<void> {
        this.setState(RunState.Stopping);
        this.papyros.io.onRunEnd();
        this.papyros.debugger.onRunEnd();
        const backend = await this.backend;
        await backend.interrupt();

        const startTime = new Date().getTime();
        while (this.state === RunState.Stopping && new Date().getTime() - startTime < 5000) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        if (this.state === RunState.Stopping) {
            console.warn("Deadlock while stopping, restarting backend");
            await this.launch();
            this.setState(
                RunState.Ready,
                this.papyros.i18n.t("Papyros.interrupted", { time: (new Date().getTime() - this.runStartTime) / 1000 }),
            );
        }
    }

    public async provideInput(input: string): Promise<void> {
        const backend = await this.backend;
        this.setState(RunState.Running);
        await backend.writeMessage(input);
    }

    public async deleteFile(name: string): Promise<void> {
        const backend = await this.backend;
        await backend.workerProxy.deleteFile(name);
    }

    public async updateFile(name: string, content: string, binary: boolean): Promise<void> {
        const backend = await this.backend;
        await backend.workerProxy.updateFile(name, content, binary);
    }

    public async renameFile(oldName: string, newName: string): Promise<void> {
        const backend = await this.backend;
        await backend.workerProxy.renameFile(oldName, newName);
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
        this.onLoad({
            type: BackendEventType.Loading,
            data: JSON.stringify({
                modules: fileNames,
                status: "loading",
            }),
        });

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
            this.setState(
                RunState.Ready,
                this.papyros.i18n.t("Papyros.finished", { time: (new Date().getTime() - this.runStartTime) / 1000 }),
            );
        }
    }

    private onError(): void {
        this.setState(
            RunState.Ready,
            this.papyros.i18n.t("Papyros.finished", { time: (new Date().getTime() - this.runStartTime) / 1000 }),
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
