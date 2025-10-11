import { State, stateProperty } from "@dodona/lit-state";
import { Debugger } from "./Debugger";
import { Runner } from "./Runner";
import { InputOutput } from "./InputOutput";
import { Constants } from "./Constants";
import { Examples } from "./Examples";
import { BackendManager } from "../../communication/BackendManager";
import { makeChannel } from "sync-message";
import { I18n } from "./I18n";
import { Test } from "./Test";

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
     * Launch this instance of Papyros, making it ready to run code
     * @return {Promise<Papyros>} Promise of launching, chainable
     */
    public async launch(): Promise<Papyros> {
        if (!await this.configureInput()) {
            alert(this.i18n.t("Papyros.service_worker_error"));
        } else {
            try {
                await this.runner.launch();
            } catch {
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

    /**
     * Configure how user input is handled within Papyros
     * By default, we will try to use SharedArrayBuffers
     * If this option is not available, the optional arguments in the channelOptions config are used
     * They are needed to register a service worker to handle communication between threads
     * @return {Promise<boolean>} Promise of configuring input
     */
    private async configureInput(): Promise<boolean> {
        if (typeof SharedArrayBuffer === "undefined") {
            if (!this.serviceWorkerName || !("serviceWorker" in navigator)) {
                return false;
            }
            try {
                await navigator.serviceWorker.register(this.serviceWorkerName, { scope: "/" });
                BackendManager.channel = makeChannel({ serviceWorker: { scope: "/" } })!;
                await this.waitForActiveRegistration();
            } catch(e) {
                console.error("Error registering service worker:", e);
                return false;
            }
        } else {
            BackendManager.channel = makeChannel({ atomics: {  } })!;
        }
        return true;
    }

    private async waitForActiveRegistration(timeout: number = 5000): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const timeoutHandle = setTimeout(() => reject(new Error("Timed out waiting for activated service worker")), timeout);
            navigator.serviceWorker.ready.then(() => {
                clearTimeout(timeoutHandle);
                resolve();
            })
        })
    }
}

export const papyros = new Papyros();
