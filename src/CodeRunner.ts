import { proxy } from "comlink";
import { SyncClient } from "comsync";
import { Backend } from "./Backend";
import { BackendEvent, BackendEventType } from "./BackendEvent";
import { BackendManager } from "./BackendManager";
import { CodeEditor } from "./CodeEditor";
import {
    APPLICATION_STATE_TEXT_ID, OUTPUT_OVERFLOW_ID, RUN_BTN_ID,
    STATE_SPINNER_ID, STOP_BTN_ID
} from "./Constants";
import { InputManager } from "./InputManager";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import { renderSpinningCircle } from "./util/HTMLShapes";
import { LogType, papyrosLog } from "./util/Logging";
import {
    addListener, getElement,
    t, downloadResults, parseData
} from "./util/Util";
import {
    RenderOptions, renderWithOptions,
    renderButton, ButtonOptions, Renderable
} from "./util/Rendering";

interface DynamicButton {
    id: string;
    buttonHTML: string;
    onClick: () => void;
}

interface CodeRunnerRenderOptions {
    /**
     * Options for rendering the panel
     */
    statusPanelOptions: RenderOptions;
    /**
     * Options for rendering the InputManager
     */
    inputOptions: RenderOptions;
    /**
     * Options for rendering the editor
     */
    codeEditorOptions: RenderOptions;
}

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
     * Whether the modules are being loaded or have been loaded
     */
    loading: boolean;

}
/**
 * Helper component to manage and visualize the current RunState
 */
export class CodeRunner extends Renderable<CodeRunnerRenderOptions> {
    /**
     * The currently used programming language
     */
    private programmingLanguage: ProgrammingLanguage;
    /**
     * The editor in which the code is written
     */
    public readonly editor: CodeEditor;
    /**
     * Component to request and handle input from the user
     */
    public readonly inputManager: InputManager;
    /**
     * The backend that executes the code asynchronously
     */
    private backend: Promise<SyncClient<Backend>>;
    /**
     * Current state of the program
     */
    private state: RunState;
    /**
     * Buttons managed by this component
     */
    private buttons: Array<DynamicButton>;

    /**
     * Array of packages that are being installed
     */
    private loadingPackages: Array<string>;
    /**
     * Previous state to restore when loading is done
     */
    private previousState: RunState;

    /**
     * Construct a new RunStateManager with the given listeners
     * @param {ProgrammingLanguage} programmingLanguage The language to use
     */
    constructor(programmingLanguage: ProgrammingLanguage) {
        super();
        this.programmingLanguage = programmingLanguage;
        this.editor = new CodeEditor();
        this.inputManager = new InputManager(async (input: string) => {
            const backend = await this.backend;
            backend.writeMessage(input);
            this.setState(RunState.Running);
        });
        this.backend = Promise.resolve({} as SyncClient<Backend>);
        this.buttons = [];
        this.addButton({
            id: RUN_BTN_ID,
            buttonText: t("Papyros.run"),
            classNames: "_tw-text-white _tw-bg-blue-500"
        }, () => this.runCode(this.editor.getCode()));
        this.addButton({
            id: STOP_BTN_ID,
            buttonText: t("Papyros.stop"),
            classNames: "_tw-text-white _tw-bg-red-500"
        }, () => this.stop());
        BackendManager.subscribe(BackendEventType.Input,
            () => this.setState(RunState.AwaitingInput));
        this.loadingPackages = [];
        this.previousState = RunState.Ready;
        BackendManager.subscribe(BackendEventType.Loading,
            e => this.onLoad(e));
        this.state = RunState.Ready;
    }

    /**
     * Start the backend to enable running code
     */
    public async start(): Promise<void> {
        this.setState(RunState.Loading);
        const backend = BackendManager.getBackend(this.programmingLanguage);
        this.editor.setProgrammingLanguage(this.programmingLanguage);
        // Use a Promise to immediately enable running while downloading
        // eslint-disable-next-line no-async-promise-executor
        this.backend = new Promise(async resolve => {
            const workerProxy = backend.workerProxy;
            await workerProxy
                // Allow passing messages between worker and main thread
                .launch(proxy((e: BackendEvent) => BackendManager.publish(e)));
            this.editor.setCompletionSource(async context => {
                const completionContext = Backend.convertCompletionContext(context);
                return await workerProxy.autocomplete(completionContext);
            });
            this.editor.setLintingSource(
                async view => {
                    const workerDiagnostics = await workerProxy.lintCode(this.editor.getCode());
                    return workerDiagnostics.map(d => {
                        const fromline = view.state.doc.line(d.lineNr);
                        const toLine = view.state.doc.line(d.endLineNr);
                        const from = Math.min(fromline.from + d.columnNr, fromline.to);
                        const to = Math.min(toLine.from + d.endColumnNr, toLine.to);
                        return { ...d, from: from, to: to };
                    });
                });
            return resolve(backend);
        });
        this.editor.focus();
        this.setState(RunState.Ready);
    }

    /**
     * Interrupt the currently running code
     * @return {Promise<void>} Promise of stopping
     */
    public async stop(): Promise<void> {
        this.setState(RunState.Stopping);
        BackendManager.publish({
            type: BackendEventType.End,
            data: "User cancelled run", contentType: "text/plain"
        });
        await this.backend.then(b => b.interrupt());
    }

    /**
     * Set the used programming language to the given one to allow editing and running code
     * @param {ProgrammingLanguage} programmingLanguage The language to use
     */
    public async setProgrammingLanguage(programmingLanguage: ProgrammingLanguage): Promise<void> {
        if (this.programmingLanguage !== programmingLanguage) { // Expensive, so ensure it is needed
            await this.backend.then(b => b.interrupt());
            this.programmingLanguage = programmingLanguage;
            await this.start();
        }
    }

    public getProgrammingLanguage(): ProgrammingLanguage {
        return this.programmingLanguage;
    }

    /**
     * Get the button to run the code
     */
    public get runButton(): HTMLButtonElement {
        return getElement<HTMLButtonElement>(RUN_BTN_ID);
    }

    /**
     * Get the button to interrupt the code
     */
    public get stopButton(): HTMLButtonElement {
        return getElement<HTMLButtonElement>(STOP_BTN_ID);
    }

    /**
     * Show or hide the spinning circle, representing a running animation
     * @param {boolean} show Whether to show the spinner
     */
    private showSpinner(show: boolean): void {
        getElement(STATE_SPINNER_ID).style.display = show ? "" : "none";
    }

    /**
     * Show the current state of the program to the user
     * @param {RunState} state The current state of the run
     * @param {string} message Optional message to indicate the state
     */
    public setState(state: RunState, message?: string): void {
        this.state = state;
        this.stopButton.disabled = [RunState.Ready, RunState.Loading].includes(state);
        if (state === RunState.Ready) {
            this.showSpinner(false);
            this.runButton.disabled = false;
        } else {
            this.showSpinner(true);
            this.runButton.disabled = true;
        }
        getElement(APPLICATION_STATE_TEXT_ID).innerText =
            message || t(`Papyros.states.${state}`);
    }

    public getState(): RunState {
        return this.state;
    }

    /**
     * Add a button to display to the user
     * @param {ButtonOptions} options Options for rendering the button
     * @param {function} onClick Listener for click events on the button
     */
    public addButton(options: ButtonOptions, onClick: () => void): void {
        this.buttons.push({
            id: options.id,
            buttonHTML: renderButton(options),
            onClick: onClick
        });
    }

    protected override _render(options: CodeRunnerRenderOptions): HTMLElement {
        const rendered = renderWithOptions(options.statusPanelOptions, `
<div class="_tw-grid _tw-grid-cols-2 _tw-items-center _tw-mx-1">
    <div class="_tw-col-span-1 _tw-flex _tw-flex-row">
        ${this.buttons.map(b => b.buttonHTML).join("\n")}
    </div>
    <div class="_tw-col-span-1 _tw-flex _tw-flex-row-reverse _tw-items-center">
        <div id="${APPLICATION_STATE_TEXT_ID}"></div>
        ${renderSpinningCircle(STATE_SPINNER_ID, "_tw-border-gray-200 _tw-border-b-red-500")}
    </div>
</div>`);
        // Buttons are freshly added to the DOM, so attach listeners now
        this.buttons.forEach(b => addListener(b.id, b.onClick, "click"));
        this.setState(this.state);
        this.inputManager.render(options.inputOptions);
        this.editor.render(options.codeEditorOptions);
        this.editor.setPanel(rendered);
        // Set language again to update the placeholder
        this.editor.setProgrammingLanguage(this.programmingLanguage);
        return rendered;
    }

    /**
     * @param {string} code The code to run
     * @return {Promise<void>} Promise of running the code
     */
    public async runCode(code: string): Promise<void> {
        // Setup pre-run
        this.setState(RunState.Running);
        BackendManager.publish({
            type: BackendEventType.Start,
            data: "User started run", contentType: "text/plain"
        });
        const start = new Date().getTime();
        let endMessage = "Program finishd normally";
        let interrupted = false;
        let terminated = false;
        const backend = await this.backend;
        try {
            await backend.call(
                backend.workerProxy.runCode, code
            );
        } catch (error: any) {
            if (error.type === "InterruptError") {
                // Error signaling forceful interrupt
                interrupted = true;
                terminated = true;
            } else {
                BackendManager.publish({
                    type: BackendEventType.Error,
                    data: JSON.stringify(error),
                    contentType: "text/json"
                });
                endMessage = "Program terminated due to error: " + error.constructor.name;
            }
        } finally {
            if (this.state !== RunState.Stopping) {
                // Was interrupted, End message already published
                BackendManager.publish({
                    type: BackendEventType.End,
                    data: endMessage, contentType: "text/plain"
                });
            } else {
                interrupted = true;
            }
            const end = new Date().getTime();
            this.setState(RunState.Ready, t(
                interrupted ? "Papyros.interrupted" : "Papyros.finished",
                { time: (end - start) / 1000 }));
            if (terminated) {
                await this.start();
            }
            const overflowLink = getElement(OUTPUT_OVERFLOW_ID);
            overflowLink.hidden = !await backend.workerProxy.hasOverflow();
            overflowLink.addEventListener("click", async () => {
                const overflowResults = (await backend.workerProxy.getOverflow())
                    .map(e => e.data).join("\n");
                downloadResults(overflowResults, "overflow-results.txt");
            });
        }
    }

    /**
     * Callback to handle loading events
     * @param {BackendEvent} e The loading event
     */
    private onLoad(e: BackendEvent): void {
        const loadingData = parseData(e.data, e.contentType) as LoadingData;
        if (loadingData.loading) {
            loadingData.modules.forEach(m => {
                if (!this.loadingPackages.includes(m)) {
                    this.loadingPackages.push(m);
                }
            });
        } else {
            loadingData.modules.forEach(m => {
                const index = this.loadingPackages.indexOf(m);
                if (index !== -1) {
                    this.loadingPackages.splice(index, 1);
                }
            });
        }
        if (this.loadingPackages.length > 0) {
            if (this.state !== RunState.Loading) {
                this.previousState = this.state;
            }
            const packageMessage = t("Papyros.loading", {
                // limit amount of package names shown
                packages: this.loadingPackages.slice(0, 3).join(",")
            });
            this.setState(RunState.Loading, packageMessage);
        } else {
            this.setState(this.previousState);
        }
    }
}
