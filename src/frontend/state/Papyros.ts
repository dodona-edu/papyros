import { State } from "@dodona/lit-state";
import { Debugger } from "./Debugger";
import { Runner, RunState } from "./Runner";
import { InputOutput } from "./InputOutput";
import { Constants } from "./Constants";
import { Examples } from "./Examples";
import { BackendManager } from "../../communication/BackendManager";
import { EventBus } from "../../communication/EventBus";
import { Channel } from "../../sync/channel";
import { ProgrammingLanguage } from "../../ProgrammingLanguage";
import { I18n } from "./I18n";
import { Test } from "./Test";
import { PapyrosLaunchError } from "./PapyrosErrors";
import { PapyrosRuntime } from "./PapyrosRuntime";

/**
 * Options for creating a Papyros instance
 */
export interface PapyrosOptions {
    /**
     * The runtime to run code in. Instances given the same runtime share its workers, so
     * only one of them can run code at a time. Without one, the instance gets a private
     * runtime that is disposed along with it.
     */
    runtime?: PapyrosRuntime;
}

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

    /**
     * The workers and input channel this instance runs code with
     */
    readonly runtime: PapyrosRuntime;
    /**
     * Whether the runtime was created for this instance alone
     */
    readonly ownsRuntime: boolean;

    constructor(options: PapyrosOptions = {}) {
        super();
        this.ownsRuntime = options.runtime === undefined;
        this.runtime = options.runtime ?? new PapyrosRuntime();
        this.runtime.attach(this);
    }

    public get serviceWorkerName(): string {
        return this.runtime.serviceWorkerName;
    }

    public set serviceWorkerName(value: string) {
        this.runtime.serviceWorkerName = value;
    }

    /**
     * The channel this instance's backends read their input from, when they need one
     */
    public get channel(): Channel | null {
        return this.runtime.channel;
    }

    /**
     * Launch this instance of Papyros, making it ready to run code.
     *
     * Resolves once the runtime can run code, so awaiting this waits for the whole
     * runtime to download. A failed launch is reported to the error handler and
     * offered as a retry instead of being thrown.
     *
     * @return {Promise<Papyros>} Promise of launching, chainable
     */
    public async launch(): Promise<Papyros> {
        if (!this.canDeferChannel() && !(await this.ensureChannel())) {
            // Without a channel the backend is never launched, so the controls must not
            // offer a run or stop that has nothing to act on
            this.runner.setState(RunState.Error, this.i18n.t("Papyros.service_worker_error"));
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
     * Release the resources held by this instance: in flight launches are abandoned and
     * the instance cannot run code afterwards. A private runtime is disposed along with
     * it, terminating its workers. On a shared runtime, a run of this instance is killed
     * and the workers are left to the other instances.
     */
    public dispose(): void {
        const running = this.runtime.isRunning(this);
        this.runner.dispose();
        if (this.ownsRuntime) {
            this.runtime.dispose();
        } else {
            if (running) {
                // An interrupt can leave the worker busy for a while, or forever in a
                // JavaScript loop, and the other instances cannot run until it is free
                this.runtime.restartWorker(this.runner.programmingLanguage);
            }
            this.runtime.detach(this);
        }
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
    public ensureChannel(): Promise<boolean> {
        return this.runtime.ensureChannel();
    }
}

export const papyros = new Papyros();
