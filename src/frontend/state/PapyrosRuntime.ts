import { proxy } from "comlink";
import { State, stateProperty } from "@dodona/lit-state";
import { SyncClient } from "../../sync/SyncClient";
import { Backend } from "../../backend/Backend";
import { BackendEvent, BackendEventType } from "../../communication/BackendEvent";
import { BackendManager } from "../../communication/BackendManager";
import { Channel, makeChannel } from "../../sync/channel";
import { CLAIM_CLIENTS_MESSAGE } from "../../communication/InputWorker";
import { ProgrammingLanguage } from "../../ProgrammingLanguage";
import { ServiceWorkerRegistrationError } from "./PapyrosErrors";
import type { Papyros } from "./Papyros";

/**
 * In flight service worker registrations, shared between runtimes: a page can only
 * have one registration per scope anyway, so runtimes wait on the same promise
 * instead of racing the browser. Failed registrations are removed so they can retry.
 */
const serviceWorkerRegistrations: Map<string, Promise<ServiceWorkerRegistration>> = new Map();

/**
 * A run of code by one instance on a runtime. The worker puts the id on every event
 * of the run, so the runtime can hand them to the instance that started it.
 */
export interface Run {
    readonly id: number;
    readonly owner: Papyros;
}

/**
 * The backend workers and input channel that run code for one or more Papyros instances.
 *
 * Every Papyros gets a private runtime unless it is given one. Instances given the same
 * runtime share one worker per language: only one of them can run code at a time, and
 * the events of a run go to the instance that started it.
 */
export class PapyrosRuntime extends State {
    @stateProperty
    pyodideAssetURL: string | undefined = undefined;

    /**
     * Whether Python may use JSPI stack switching for input and sleep where the browser
     * supports it. Set to false to force the service worker or SharedArrayBuffer channel,
     * for instance to work around a browser whose stack switching misbehaves.
     */
    @stateProperty
    allowJspi: boolean = true;

    @stateProperty
    serviceWorkerName: string = "InputServiceWorker.js";

    /**
     * The run in progress, or null when nothing runs
     */
    @stateProperty
    currentRun: Run | null = null;

    /**
     * The most recent run, which keeps receiving its events after it ended: the worker
     * tags them as it emits them, but they can arrive after runCode has settled.
     * Events of any earlier run are dropped.
     */
    private lastRun: Run | null = null;
    private lastRunId: number = 0;

    /**
     * The channel the backends read their input from, when they need one
     */
    public channel: Channel | null = null;

    /**
     * In flight channel setup, so concurrent callers build the channel once
     */
    private channelPromise?: Promise<Channel | null>;

    private instances: Set<Papyros> = new Set();

    /**
     * The live backend client per language
     */
    private clients: Map<ProgrammingLanguage, SyncClient<Backend>> = new Map();
    /**
     * Factory overrides for this runtime, so tests can inject a backend without
     * touching the static registry shared by every runtime
     */
    private backendCreators: Map<ProgrammingLanguage, () => SyncClient<Backend>> = new Map();
    /**
     * The launch of each worker, so relaunching a live client is free. Keyed by the
     * Worker itself: a restart that replaces the worker automatically invalidates the
     * entry, and the next caller launches the new one.
     */
    private launched: WeakMap<object, Promise<SyncClient<Backend>>> = new WeakMap();
    /**
     * Whether a worker is already being replaced. Every lint that lands while the
     * old one is still exhausted fails too, and each failure asks for a recovery.
     */
    private recovering: boolean = false;
    private disposed: boolean = false;

    /**
     * Route the worker's events to the given instance from now on
     */
    public attach(papyros: Papyros): void {
        this.instances.add(papyros);
    }

    /**
     * Stop routing events to the given instance, and give up its claim on the worker
     */
    public detach(papyros: Papyros): void {
        this.instances.delete(papyros);
        if (this.currentRun?.owner === papyros) {
            this.currentRun = null;
        }
        if (this.lastRun?.owner === papyros) {
            this.lastRun = null;
        }
    }

    /**
     * Claim the worker for a run by the given instance
     * @return {Run | null} The new run, or null while any run is in progress
     */
    public tryAcquire(papyros: Papyros): Run | null {
        if (this.currentRun) {
            return null;
        }
        const run = { id: ++this.lastRunId, owner: papyros };
        this.currentRun = run;
        this.lastRun = run;
        return run;
    }

    public isRunning(papyros: Papyros): boolean {
        return this.currentRun?.owner === papyros;
    }

    /**
     * Whether a run by another instance is in progress, which the given instance must wait out
     */
    public isBusyFor(papyros: Papyros): boolean {
        return this.currentRun !== null && this.currentRun.owner !== papyros;
    }

    /**
     * End the given run, if it is still in progress
     */
    public release(run: Run): void {
        if (this.currentRun === run) {
            this.currentRun = null;
        }
    }

    /**
     * Terminate every worker this runtime started and abandon in flight launches.
     * No instance can run code on it afterwards.
     */
    public dispose(): void {
        this.disposed = true;
        for (const client of this.clients.values()) {
            try {
                client.terminate();
            } catch {
                // An injected or never-started client has no worker to terminate
            }
        }
        this.clients.clear();
        this.instances.clear();
        this.currentRun = null;
        this.lastRun = null;
    }

    /**
     * Use a custom backend for the given language on this runtime only
     * @param {ProgrammingLanguage} language The language to override
     * @param {Function} backendCreator The constructor for a SyncClient
     */
    public registerBackend(language: ProgrammingLanguage, backendCreator: () => SyncClient<Backend>): void {
        this.backendCreators.set(language, backendCreator);
        this.clients.delete(language);
    }

    private client(language: ProgrammingLanguage): SyncClient<Backend> {
        let client = this.clients.get(language);
        if (!client) {
            const create = this.backendCreators.get(language);
            client = create ? create() : BackendManager.createBackend(language);
            this.clients.set(language, client);
        }
        return client;
    }

    /**
     * The client for a language once its worker can run code. Launches the worker
     * when it is not up yet, including a worker that was replaced since its last launch.
     * @param {ProgrammingLanguage} language The language to run
     * @return {Promise<SyncClient<Backend>>} The launched client
     */
    public async ready(language: ProgrammingLanguage): Promise<SyncClient<Backend>> {
        if (this.disposed) {
            throw new Error("This runtime has been disposed");
        }
        const backend = this.client(language);
        // An injected test double has no worker, so fall back to keying on the client
        const worker: object = backend.worker ?? backend;
        let launched = this.launched.get(worker);
        if (!launched) {
            launched = this.launchWorker(language, backend, worker);
            this.launched.set(worker, launched);
        }
        return launched;
    }

    private async launchWorker(
        language: ProgrammingLanguage,
        backend: SyncClient<Backend>,
        worker: object,
    ): Promise<SyncClient<Backend>> {
        try {
            // Allow passing messages between worker and main thread
            await backend.workerProxy.launch(
                proxy((e: BackendEvent) => {
                    // A replaced worker can still have events on their way
                    if ((backend.worker ?? backend) === worker) {
                        this.dispatch(e);
                    }
                }),
                this.pyodideAssetURL,
                this.allowJspi,
            );
            backend.usesPromiseTransport = await backend.workerProxy.usesJspi();
        } catch (error) {
            // Let a retry attempt the launch again instead of replaying this failure
            this.launched.delete(worker);
            if (this.clients.get(language) === backend) {
                // The module map of the failed worker keeps the failed import, so retrying in
                // it fails the same way: drop the client so the next launch spawns a fresh
                // worker. Keyed on the client, so a launch a language switch superseded is
                // cleaned up too, while a client already replaced for this language is left alone.
                this.clients.delete(language);
                try {
                    backend.terminate();
                } catch {
                    // An injected or never-started client has no worker to terminate
                }
            }
            throw error;
        }
        if (!backend.usesPromiseTransport) {
            // This backend blocks on the channel, so it needs one to exist before it runs.
            // Registration may not have happened yet: Papyros defers it when the browser
            // can suspend the wasm stack, since Python then never touches it.
            // A failure here is reported by ensureChannel and leaves the channel null, so
            // running code still works and only reading input fails.
            await this.ensureChannel();
        }
        // Assign either way, so a client that switched to JSPI drops a channel it no longer uses
        backend.channel = this.channel;
        return backend;
    }

    /**
     * Replace the worker of the given language with a fresh one, which the next caller of
     * ready() launches. A run in progress on the old worker fails as interrupted.
     */
    public restartWorker(language: ProgrammingLanguage): void {
        try {
            this.clients.get(language)?.restart();
        } catch {
            // An injected or never-started client has no worker to replace
        }
    }

    /**
     * Replace a worker that can no longer run or lint code and launch its replacement.
     * Concurrent requests while a replacement is underway are ignored.
     * @param {ProgrammingLanguage} language The language of the unusable worker
     * @param {Papyros} requester The instance that ran into the unusable worker
     * @return {Promise<boolean>} Whether this call replaced the worker
     */
    public async recover(language: ProgrammingLanguage, requester: Papyros): Promise<boolean> {
        if (this.disposed || this.recovering) {
            return false;
        }
        this.recovering = true;
        try {
            // A run suspended in input() dies with its worker, so close its prompt
            // and flush its frames the way stop() does
            const owner = this.currentRun?.owner ?? requester;
            owner.io.onRunEnd();
            owner.debugger.onRunEnd();
            this.restartWorker(language);
            await requester.runner.launch();
            return true;
        } finally {
            this.recovering = false;
        }
    }

    /**
     * Hand the events of a run to the instance that started it, and Loading events to
     * every instance. Other events from outside a run go to an instance only on its
     * private runtime.
     */
    private dispatch(e: BackendEvent): void {
        const run = this.lastRun;
        if (e.runId !== undefined && e.runId !== run?.id) {
            return;
        }
        if (e.type === BackendEventType.Loading) {
            // Every editor relints once a package it may import has been installed
            for (const papyros of this.instances) {
                papyros.events.publish(e);
            }
        } else if (e.runId !== undefined) {
            run?.owner.events.publish(e);
        } else {
            // A shared runtime cannot tell which instance output of code that outlived its
            // run, or the files provideFiles reports, belongs to
            for (const papyros of this.instances) {
                if (papyros.ownsRuntime) {
                    papyros.events.publish(e);
                }
            }
        }
    }

    private report(error: Error): void {
        (this.lastRun?.owner ?? this.instances.values().next().value)?.errorHandler(error);
    }

    /**
     * Make sure a channel exists, registering the input service worker if that is what it takes.
     * Idempotent, and safe to call from several places at once.
     * @return {Promise<boolean>} Whether a channel is available
     */
    public async ensureChannel(): Promise<boolean> {
        if (this.channel) {
            return true;
        }
        this.channelPromise ??= this.createChannel();
        return (await this.channelPromise) !== null;
    }

    private async createChannel(): Promise<Channel | null> {
        if (typeof SharedArrayBuffer !== "undefined") {
            this.channel = makeChannel({ atomics: {} })!;
            return this.channel;
        }
        if (!this.serviceWorkerName || !("serviceWorker" in navigator)) {
            this.report(
                new ServiceWorkerRegistrationError("No service worker available to handle input", {
                    cause: new Error(`serviceWorkerName=${this.serviceWorkerName}`),
                }),
            );
            return null;
        }
        try {
            const registration = await this.registerServiceWorker();
            // The channel's scope becomes the base of a synchronous XHR inside the worker;
            // a relative scope resolves against the worker's own base URL, which is opaque
            // in a worker bootstrapped from a blob (see BackendManager.setWorkerUrl), so
            // registration.scope (an absolute URL) is used instead
            this.channel = makeChannel({ serviceWorker: { scope: registration.scope } })!;
            return this.channel;
        } catch (e) {
            this.report(new ServiceWorkerRegistrationError("Error registering service worker", { cause: e }));
            // Allow a later backend to try again rather than caching the failure forever
            this.channelPromise = undefined;
            return null;
        }
    }

    private registerServiceWorker(): Promise<ServiceWorkerRegistration> {
        let registration = serviceWorkerRegistrations.get(this.serviceWorkerName);
        if (!registration) {
            registration = navigator.serviceWorker.register(this.serviceWorkerName, { scope: "/" }).then(async (r) => {
                await this.waitForController(await this.waitForActiveRegistration());
                return r;
            });
            registration.catch(() => serviceWorkerRegistrations.delete(this.serviceWorkerName));
            serviceWorkerRegistrations.set(this.serviceWorkerName, registration);
        }
        return registration;
    }

    private async waitForActiveRegistration(timeout: number = 5000): Promise<ServiceWorkerRegistration> {
        return new Promise<ServiceWorkerRegistration>((resolve, reject) => {
            const timeoutHandle = setTimeout(
                () => reject(new Error("Timed out waiting for activated service worker")),
                timeout,
            );
            navigator.serviceWorker.ready.then((registration) => {
                clearTimeout(timeoutHandle);
                resolve(registration);
            });
        });
    }

    /**
     * Make sure the active service worker controls this page, since the channel's requests
     * only reach it from a controlled page. A hard reload bypasses the service worker and
     * leaves the page uncontrolled, so the worker is asked to claim it.
     */
    private async waitForController(registration: ServiceWorkerRegistration, timeout: number = 5000): Promise<void> {
        const container = navigator.serviceWorker;
        if (container.controller) {
            return;
        }
        return new Promise<void>((resolve, reject) => {
            const onControllerChange = (): void => {
                clearTimeout(timeoutHandle);
                resolve();
            };
            const timeoutHandle = setTimeout(() => {
                container.removeEventListener("controllerchange", onControllerChange);
                reject(new Error("The service worker does not control this page, reloading the page should fix this"));
            }, timeout);
            container.addEventListener("controllerchange", onControllerChange, { once: true });
            registration.active?.postMessage(CLAIM_CLIENTS_MESSAGE);
        });
    }
}
