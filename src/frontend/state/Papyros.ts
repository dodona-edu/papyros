import { State, stateProperty } from "@dodona/lit-state";
import { Debugger } from "./Debugger";
import { Runner } from "./Runner";
import { InputOutput } from "./InputOutput";
import { Constants } from "./Constants";
import { Examples } from "./Examples";
import { BackendManager } from "../../communication/BackendManager";
import { Channel, makeChannel } from "../../sync/channel";
import { ProgrammingLanguage } from "../../ProgrammingLanguage";
import { I18n } from "./I18n";
import { Test } from "./Test";
import { PapyrosLaunchError, ServiceWorkerRegistrationError } from "./PapyrosErrors";

export class Papyros extends State {
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
     * In flight channel setup, so concurrent callers register the service worker once
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
     * Set an error handler in papyros. Papyros will pass any errors to this handler that should be investigated but don't bubble up naturally.
     *
     * @param handler An error handler (e.g. something that passes the error on to sentry)
     */
    public setErrorHandler(handler: (error: Error) => void): void {
        this.errorHandler = handler;
    }

    /** @see BackendManager.setWorkerUrl */
    public setWorkerUrl(language: ProgrammingLanguage, url: string | URL): void {
        BackendManager.setWorkerUrl(language, url);
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
        if (BackendManager.channel) {
            return true;
        }
        this.channelPromise ??= this.createChannel();
        return (await this.channelPromise) !== null;
    }

    private async createChannel(): Promise<Channel | null> {
        if (typeof SharedArrayBuffer !== "undefined") {
            BackendManager.channel = makeChannel({ atomics: {} })!;
            return BackendManager.channel;
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
            const registration = await navigator.serviceWorker.register(this.serviceWorkerName, { scope: "/" });
            await this.waitForActiveRegistration();
            // The channel's scope becomes the base of a synchronous XHR inside the worker;
            // a relative scope resolves against the worker's own base URL, which is opaque
            // in a worker bootstrapped from a blob (see BackendManager.setWorkerUrl), so
            // registration.scope (an absolute URL) is used instead
            BackendManager.channel = makeChannel({ serviceWorker: { scope: registration.scope } })!;
            return BackendManager.channel;
        } catch (e) {
            this.errorHandler(new ServiceWorkerRegistrationError("Error registering service worker", { cause: e }));
            // Allow a later backend to try again rather than caching the failure forever
            this.channelPromise = undefined;
            return null;
        }
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
