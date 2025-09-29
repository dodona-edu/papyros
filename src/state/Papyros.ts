import { State, stateProperty } from "@dodona/lit-state";
import { Debugger } from "./Debugger";
import { Runner } from "./Runner";
import { InputOutput } from "./InputOutput";
import { Constants } from "./Constants";
import { Examples } from "./Examples";
import { BackendManager } from "../BackendManager";
import { makeChannel } from "sync-message";
import { cleanCurrentUrl } from "../util/Util";
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
            const serviceWorkerRoot = cleanCurrentUrl(true);
            const serviceWorkerUrl = serviceWorkerRoot + this.serviceWorkerName;
            try {
                await navigator.serviceWorker.register(serviceWorkerUrl, { scope: "/" });
                BackendManager.channel = makeChannel({ serviceWorker: { scope: serviceWorkerRoot } })!;
            } catch(e) {
                console.error("Error registering service worker:", e);
                return false;
            }
        } else {
            BackendManager.channel = makeChannel({ atomics: {  } })!;
        }
        return true;
    }
}

export const papyros = new Papyros();
