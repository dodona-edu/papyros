import { State, stateProperty } from "@dodona/lit-state";
import { Debugger } from "./Debugger";
import { Runner } from "./Runner";
import { InputOutput } from "./InputOutput";
import { Constants } from "./Constants";
import { Examples } from "./Examples";
import { EventBus } from "../../communication/EventBus";
import { Channel, makeChannel } from "../../sync/channel";
import { ProgrammingLanguage } from "../../ProgrammingLanguage";
import { I18n } from "./I18n";
import { Test } from "./Test";
import { PapyrosLaunchError, ServiceWorkerRegistrationError } from "./PapyrosErrors";

/**
 * In flight service worker registrations, shared between instances: a page can only
 * have one registration per scope anyway, so instances wait on the same promise
 * instead of racing the browser. Failed registrations are removed so they can retry.
 */
const serviceWorkerRegistrations: Map<string, Promise<void>> = new Map();

export class Papyros extends State {
    // The bus is declared first so the states below can subscribe to it while constructing
    readonly events: EventBus = new EventBus();
    readonly debugger: Debugger = new Debugger(this);
    readonly runner: Runner = new Runner(this);
    readonly io: InputOutput = new InputOutput(this);
    readonly constants: Constants = new Constants();
    readonly examples: Examples = new Examples(this);
    readonly i18n = new I18n();
    readonly test: Test = new Test(this);
    errorHandler: (error: Error) => void = () => {};

    @stateProperty
    serviceWorkerName: string = "InputServiceWorker.js";

    /**
     * The channel this instance's backends read their input from, when they need one
     */
    public channel: Channel | null = null;

    /**
     * In flight channel setup, so concurrent callers build the channel once
     */
    private channelPromise?: Promise<Channel | null>;

    /**
     * Launch this instance of Papyros, making it ready to run code
     * @return {Promise<Papyros>} Promise of launching, chainable
     */
    public async launch(): Promise<Papyros> {
        if (!this.canDeferChannel() && !(await this.ensureChannel())) {
            alert(this.i18n.t("Papyros.service_worker_error"));
        } else {
            try {
                await this.runner.launch();
            } catch (e) {
                this.errorHandler(
                    new PapyrosLaunchError("Error launching papyros after registering service worker", { cause: e }),
                );
                if (confirm(this.i18n.t("Papyros.launch_error"))) {
                    return this.launch();
                }
            }
        }
        return this;
    }

    /**
     * Release the resources held by this instance: its workers are terminated and
     * in flight launches are abandoned. The instance cannot run code afterwards.
     */
    public dispose(): void {
        this.runner.dispose();
        // Drops any pending frame flush timer
        this.debugger.reset();
    }

    /**
     * Set an error handler in papyros. Papyros will pass any errors to this handler that should be investigated but don't bubble up naturally.
     *
     * @param handler An error handler (e.g. something that passes the error on to sentry)
     */
    public setErrorHandler(handler: (error: Error) => void): void {
        this.errorHandler = handler;
    }

    /**
     * Whether registering the service worker can wait until a backend proves it needs one.
     *
     * This mirrors how Pyodide detects stack switching, which accepts the older Suspender
     * shape as well as Suspending. It is only a hint: the worker's own probe decides the
     * transport, so being wrong here costs at most one service worker nobody uses.
     */
    private canDeferChannel(): boolean {
        const wasm = WebAssembly as { Suspending?: unknown; Suspender?: unknown };
        const stackSwitching = wasm.Suspending !== undefined || wasm.Suspender !== undefined;
        return (
            typeof SharedArrayBuffer === "undefined" &&
            stackSwitching &&
            this.runner.allowJspi &&
            this.runner.programmingLanguage === ProgrammingLanguage.Python
        );
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
            this.errorHandler(
                new ServiceWorkerRegistrationError("No service worker available to handle input", {
                    cause: new Error(`serviceWorkerName=${this.serviceWorkerName}`),
                }),
            );
            return null;
        }
        try {
            await this.registerServiceWorker();
            this.channel = makeChannel({ serviceWorker: { scope: "/" } })!;
            return this.channel;
        } catch (e) {
            this.errorHandler(new ServiceWorkerRegistrationError("Error registering service worker", { cause: e }));
            // Allow a later backend to try again rather than caching the failure forever
            this.channelPromise = undefined;
            return null;
        }
    }

    private registerServiceWorker(): Promise<void> {
        let registration = serviceWorkerRegistrations.get(this.serviceWorkerName);
        if (!registration) {
            registration = navigator.serviceWorker
                .register(this.serviceWorkerName, { scope: "/" })
                .then(() => this.waitForActiveRegistration());
            registration.catch(() => serviceWorkerRegistrations.delete(this.serviceWorkerName));
            serviceWorkerRegistrations.set(this.serviceWorkerName, registration);
        }
        return registration;
    }

    private async waitForActiveRegistration(timeout: number = 5000): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const timeoutHandle = setTimeout(
                () => reject(new Error("Timed out waiting for activated service worker")),
                timeout,
            );
            navigator.serviceWorker.ready.then(() => {
                clearTimeout(timeoutHandle);
                resolve();
            });
        });
    }
}

export const papyros = new Papyros();
