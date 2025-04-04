import { proxy } from "comlink";
import { SyncClient } from "comsync";
import { Backend, RunMode } from "./Backend";
import { BackendEvent, BackendEventType } from "./BackendEvent";
import { BackendManager } from "./BackendManager";
import { CodeEditor } from "./editor/CodeEditor";
import {
    addPapyrosPrefix,
    APPLICATION_STATE_TEXT_ID,
    CODE_BUTTONS_WRAPPER_ID,
    DEFAULT_EDITOR_DELAY,
    RUN_BUTTONS_WRAPPER_ID,
    STATE_SPINNER_ID,
    STOP_BTN_ID
} from "./Constants";
import { InputManager, InputManagerRenderOptions, InputMode } from "./InputManager";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import { renderSpinningCircle } from "./util/HTMLShapes";
import { addListener, downloadResults, getElement, parseData, t } from "./util/Util";
import {
    appendClasses,
    ButtonOptions,
    Renderable,
    renderButton,
    RenderOptions,
    renderWithOptions
} from "./util/Rendering";
import { OutputManager } from "./OutputManager";
import { Debugger } from "./Debugger";
import { BatchInputHandler } from "./input/BatchInputHandler";

const MODE_ICONS: Record<RunMode, string> = {
    "debug": "<svg xmlns=\"http://www.w3.org/2000/svg\" height=\"18px\" viewBox=\"0 0 24 24\" width=\"18px\" fill=\"currentColor\"><path d=\"M19 7H16.19C15.74 6.2 15.12 5.5 14.37 5L16 3.41L14.59 2L12.42 4.17C11.96 4.06 11.5 4 11 4S10.05 4.06 9.59 4.17L7.41 2L6 3.41L7.62 5C6.87 5.5 6.26 6.21 5.81 7H3V9H5.09C5.03 9.33 5 9.66 5 10V11H3V13H5V14C5 14.34 5.03 14.67 5.09 15H3V17H5.81C7.26 19.5 10.28 20.61 13 19.65V19C13 18.43 13.09 17.86 13.25 17.31C12.59 17.76 11.8 18 11 18C8.79 18 7 16.21 7 14V10C7 7.79 8.79 6 11 6S15 7.79 15 10V14C15 14.19 15 14.39 14.95 14.58C15.54 14.04 16.24 13.62 17 13.35V13H19V11H17V10C17 9.66 16.97 9.33 16.91 9H19V7M13 9V11H9V9H13M13 13V15H9V13H13M17 16V22L22 19L17 16Z\"></path></svg>",
    "doctest": "<i class=\"mdi mdi-play\"></i>",
    "run": "<i class=\"mdi mdi-play\"></i>"
};

const DEBUG_STOP_ICON = "<svg xmlns=\"http://www.w3.org/2000/svg\" height=\"18px\" viewBox=\"0 0 24 24\" width=\"18px\" fill=\"currentColor\"><path d=\"M19 7H16.19C15.74 6.2 15.12 5.5 14.37 5L16 3.41L14.59 2L12.42 4.17C11.96 4.06 11.5 4 11 4S10.05 4.06 9.59 4.17L7.41 2L6 3.41L7.62 5C6.87 5.5 6.26 6.21 5.81 7H3V9H5.09C5.03 9.33 5 9.66 5 10V11H3V13H5V14C5 14.34 5.03 14.67 5.09 15H3V17H5.81C7.26 19.5 10.28 20.61 13 19.65V19C13 18.43 13.09 17.86 13.25 17.31C12.59 17.76 11.8 18 11 18C8.79 18 7 16.21 7 14V10C7 7.79 8.79 6 11 6S15 7.79 15 10V14C15 14.19 15 14.39 14.95 14.58C15.54 14.04 16.24 13.62 17 13.35V13H19V11H17V10C17 9.66 16.97 9.33 16.91 9H19V7M13 9V11H9V9H13M13 13V15H9V13H13M16 16H22V22H16V16Z\" /></svg>";

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
    inputOptions: InputManagerRenderOptions;
    /**
     * Options for rendering the editor
     */
    codeEditorOptions: RenderOptions;
    /**
     * RenderOptions for the output field
     */
    outputOptions: RenderOptions;
    traceOptions: RenderOptions;
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
     * The status of the import
     */
    status: "loading" | "loaded" | "failed";

}

/**
 * Helper class to avoid code duplication when handling buttons
 * It is an ordered array that does not allow duplicate ids
 */
class ButtonArray extends Array<DynamicButton> {
    public add(button: ButtonOptions, onClick: () => void): void {
        this.remove(button.id);
        this.push({
            id: button.id,
            buttonHTML: renderButton(button),
            onClick
        });
    }

    public remove(id: string): void {
        const existingIndex = this.findIndex(b => b.id === id);
        if (existingIndex !== -1) {
            this.splice(existingIndex, 1);
        }
    }
}

/*
 * class function decorator that adds a delay,
 * so that the function is only called after the delay has passed
 *
 * If it is called again before the delay has passed, the previous call is cancelled
 */
function delay(delay: number) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return function (original: any, context: ClassMethodDecoratorContext) {
        let timeout: NodeJS.Timeout | undefined;
        return function (this: any, ...args: any[]) {
            clearTimeout(timeout);
            timeout = setTimeout(() => original.apply(this, args), delay);
        };
    };
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
     * Component to handle output generated by the user's code
     */
    public readonly outputManager: OutputManager;
    public readonly traceViewer: Debugger;
    /**
     * The backend that executes the code asynchronously
     */
    private backend: Promise<SyncClient<Backend>>;
    /**
     * Current state of the program
     */
    private state: RunState;
    /**
     * Foreign buttons inserted into this component
     */
    private userButtons: ButtonArray;
    /**
     * Internal buttons for different run modes
     */
    private runButtons: ButtonArray;

    /**
     * Array of packages that are being installed
     */
    private loadingPackages: Array<string>;
    /**
     * Previous state to restore when loading is done
     */
    private previousState: RunState;
    /**
     * Time at which the setState call occurred
     */
    private runStartTime: number;
    // True while running or viewing with debugger
    private _debugMode = false;

    /**
     * Construct a new RunStateManager with the given listeners
     * @param {ProgrammingLanguage} programmingLanguage The language to use
     * @param {InputMode} inputMode The input mode to use
     */
    constructor(programmingLanguage: ProgrammingLanguage, inputMode: InputMode) {
        super();
        this.programmingLanguage = programmingLanguage;
        this.editor = new CodeEditor(() => {
            if (this.state === RunState.Ready) {
                this.runCode();
            }
        });
        this.inputManager = new InputManager(async (input: string) => {
            const backend = await this.backend;
            backend.writeMessage(input);
            this.setState(RunState.Running);
        }, inputMode);
        this.outputManager = new OutputManager();
        this.backend = Promise.resolve({} as SyncClient<Backend>);
        this.userButtons = new ButtonArray();
        this.runButtons = new ButtonArray();
        this.updateRunButtons([RunMode.Debug]);
        this.editor.onChange({
            onChange: async code => {
                const backend = await this.backend;
                const modes = await backend.workerProxy.runModes(code);
                this.updateRunButtons(modes);
                this.renderCodeActionButtons();
            },
            delay: DEFAULT_EDITOR_DELAY
        });

        BackendManager.subscribe(BackendEventType.Input,
            () => this.setState(RunState.AwaitingInput));
        this.loadingPackages = [];
        BackendManager.subscribe(BackendEventType.Loading,
            e => this.onLoad(e));
        BackendManager.subscribe(BackendEventType.Start,
            e => this.onStart(e));
        BackendManager.subscribe(BackendEventType.Stop, () => this.stop());
        this.previousState = RunState.Ready;
        this.runStartTime = new Date().getTime();
        this.state = RunState.Ready;
        this.traceViewer = new Debugger();
    }

    private set debugMode(debugMode: boolean) {
        this._debugMode = debugMode;
        this.renderCodeActionButtons();

        if (this.inputManager.getInputMode() === InputMode.Batch) {
            const handler = this.inputManager.inputHandler as BatchInputHandler;
            handler.debugMode = debugMode;
        }
        this.outputManager.debugMode = debugMode;
        this.editor.debugMode = debugMode;

        if (!this._debugMode) {
            this.traceViewer.reset();
            this.outputManager.reset();
            this.inputManager.inputHandler.reset();
        }
        this.dispatchEvent(new CustomEvent("debug-mode", { detail: debugMode }));
    }

    private get debugMode(): boolean {
        return this._debugMode;
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

        this.debugMode = false;
        this.inputManager.inputHandler.reset();
        this.outputManager.reset();
        this.traceViewer.reset();
    }

    private updateRunButtons(modes: Array<RunMode>): void {
        this.runButtons = new ButtonArray();
        this.addRunButton(RunMode.Run, "btn-primary");
        modes.forEach(m => this.addRunButton(m));
    }

    private addRunButton(mode: RunMode, classNames = "btn-secondary"): void {
        const id = addPapyrosPrefix(mode)+"-code-btn";
        this.runButtons.add({
            id: id,
            buttonText: t(`Papyros.run_modes.${mode}`),
            classNames,
            icon: MODE_ICONS[mode]
        }, () => this.runCode(mode));
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
                .launch(
                    proxy((e: BackendEvent) => BackendManager.publish(e)),
                    proxy(() => {
                        this.outputManager.onOverflow(null);
                    })
                );
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
     * @return {Promise<void>} Returns when the code has been interrupted
     */
    public async stop(): Promise<void> {
        this.setState(RunState.Stopping);
        BackendManager.publish({
            type: BackendEventType.End,
            data: "User cancelled run", contentType: "text/plain"
        });
        const backend = await this.backend;
        await backend.interrupt();

        while (this.state === RunState.Stopping) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
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

    public async provideFiles(inlinedFiles: Record<string, string>, hrefFiles: Record<string, string>): Promise<void> {
        const fileNames = [...Object.keys(inlinedFiles), ...Object.keys(hrefFiles)];
        if (fileNames.length === 0) {
            return;
        }
        BackendManager.publish({ type: BackendEventType.Loading, data: JSON.stringify({
            modules: fileNames,
            status: "loading"
        }) });

        const backend = await this.backend;
        await backend.workerProxy.provideFiles(inlinedFiles, hrefFiles);
    }

    /**
     * @return {ProgrammingLanguage} The current programming language
     */
    public getProgrammingLanguage(): ProgrammingLanguage {
        return this.programmingLanguage;
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
        const stateElement = getElement(APPLICATION_STATE_TEXT_ID);
        stateElement.innerText = message || t(`Papyros.states.${state}`);
        stateElement.parentElement?.classList.toggle("show", stateElement.innerText.length > 0);
        if (state !== this.state) {
            this.previousState = this.state;
            this.state = state;
        }
        this.showSpinner(this.state !== RunState.Ready);
        this.renderCodeActionButtons();
    }

    /**
     * @return {RunState} The state of the current run
     */
    public getState(): RunState {
        return this.state;
    }

    /**
     * Remove a button from the internal button list. Requires a re-render to update
     * @param {string} id Identifier of the button to remove
     */
    private removeButton(id: string): void {
        this.userButtons.remove(id);
        this.renderUserButtons();
    }

    /**
     * Add a button to display to the user
     * @param {ButtonOptions} options Options for rendering the button
     * @param {function} onClick Listener for click events on the button
     */
    public addButton(options: ButtonOptions, onClick: () => void): void {
        this.userButtons.add(options, onClick);
        this.renderUserButtons();
    }

    /**
     * Generate a button that the user can click to process code
     * Can either run the code or interrupt it if already running
     * @return {DynamicButton} A list of buttons to interact with the code according to the current state
     */
    private getCodeActionButtons(): DynamicButton[] {
        if (this.state === RunState.Ready) {
            if (this.debugMode) {
                return [{
                    id: "stop-debug-btn",
                    buttonHTML: renderButton({
                        id: "stop-debug-btn",
                        buttonText: t("Papyros.debug.stop"),
                        classNames: "btn-secondary",
                        icon: DEBUG_STOP_ICON
                    }),
                    onClick: () => this.debugMode = false
                }];
            } else {
                return this.runButtons;
            }
        } else {
            return [{
                id: STOP_BTN_ID,
                buttonHTML: renderButton({
                    id: STOP_BTN_ID,
                    buttonText: t("Papyros.stop"),
                    classNames: "btn-danger",
                    icon: "<i class=\"mdi mdi-stop\"></i>"
                }),
                onClick: () => this.stop()
            }];
        }
    }

    /**
     * @param {DynamicButton[]} buttons The buttons to render
     * @param {string} id The id of the element to render the buttons in
     */
    private renderButtons(buttons: DynamicButton[], id: string): void {
        getElement(id).innerHTML = buttons.map(b => b.buttonHTML).join("\n");
        // Buttons are freshly added to the DOM, so attach listeners now
        buttons.forEach(b => addListener(b.id, b.onClick, "click"));
    }

    @delay(100) // Delay to prevent flickering
    private renderCodeActionButtons(): void {
        this.renderButtons(this.getCodeActionButtons(), RUN_BUTTONS_WRAPPER_ID);
    }

    @delay(100) // Delay to prevent flickering
    private renderUserButtons(): void {
        this.renderButtons(this.userButtons, CODE_BUTTONS_WRAPPER_ID);
    }

    protected override _render(options: CodeRunnerRenderOptions): HTMLElement {
        appendClasses(options.statusPanelOptions,
             
            "_tw-border-solid _tw-border-gray-200 _tw-border-b-2 dark:_tw-border-dark-mode-content");
        const rendered = renderWithOptions(options.statusPanelOptions, `
<div style="position: relative">
    <div class="papyros-state-card cm-panels">
        ${renderSpinningCircle(STATE_SPINNER_ID, "_tw-border-gray-200 _tw-border-b-red-500")}
        <div id="${APPLICATION_STATE_TEXT_ID}"></div>
    </div>
</div>
<div class="_tw-items-center _tw-px-1 _tw-flex _tw-flex-row _tw-justify-between">
    <div id="${RUN_BUTTONS_WRAPPER_ID}">
    </div>
    <div id="${CODE_BUTTONS_WRAPPER_ID}">
    </div>
</div>`);
        this.setState(this.state);
        this.renderUserButtons();
        this.inputManager.render(options.inputOptions);
        this.outputManager.render(options.outputOptions);
        this.editor.render(options.codeEditorOptions);
        this.editor.setPanel(rendered);
        // Set language again to update the placeholder
        this.editor.setProgrammingLanguage(this.programmingLanguage);
        this.traceViewer.render(options.traceOptions);
        return rendered;
    }

    /**
     * Execute the code in the editor
     * @param {RunMode} mode The mode to run with
     * @return {Promise<void>} Promise of running the code
     */
    public async runCode(mode?: RunMode): Promise<void> {
        this.debugMode = mode === RunMode.Debug;

        const code = this.editor.getCode();
        // Setup pre-run
        this.setState(RunState.Loading);
        // Ensure we go back to Loading after finishing any remaining installs
        this.previousState = RunState.Loading;
        BackendManager.publish({
            type: BackendEventType.Start,
            data: "StartClicked", contentType: "text/plain"
        });
        let interrupted = false;
        let terminated = false;
        const backend = await this.backend;
        this.runStartTime = new Date().getTime();
        try {
            await backend.call(
                backend.workerProxy.runCode, code, mode
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
                BackendManager.publish({
                    type: BackendEventType.End,
                    data: "RunError", contentType: "text/plain"
                });
            }
        } finally {
            if (this.state === RunState.Stopping) {
                // Was interrupted, End message already published
                interrupted = true;
            }
            if (terminated) {
                await this.start();
            } else if (await backend.workerProxy.hasOverflow()) {
                this.outputManager.onOverflow(async () => {
                    const backend = await this.backend;
                    const overflowResults = (await backend.workerProxy.getOverflow())
                        .map(e => e.data).join("");
                    downloadResults(
                        overflowResults,
                        "overflow-results.txt"
                    );
                });
            }
            this.setState(RunState.Ready, t(
                interrupted ? "Papyros.interrupted" : "Papyros.finished",
                { time: (new Date().getTime() - this.runStartTime) / 1000 }));
        }
    }

    /**
     * Callback to handle loading events
     * @param {BackendEvent} e The loading event
     */
    private onLoad(e: BackendEvent): void {
        const loadingData = parseData(e.data, e.contentType) as LoadingData;
        if (loadingData.status === "loading") {
            loadingData.modules.forEach(m => {
                if (!this.loadingPackages.includes(m)) {
                    this.loadingPackages.push(m);
                }
            });
        } else if (loadingData.status === "loaded") {
            loadingData.modules.forEach(m => {
                const index = this.loadingPackages.indexOf(m);
                if (index !== -1) {
                    this.loadingPackages.splice(index, 1);
                }
            });
        } else { // failed
            // If it is a true module, an Exception will be raised when running
            // So this does not need to be handled here, as it is often an incomplete package-name
            // that causes micropip to not find the correct wheel
            this.loadingPackages = [];
        }
        if (this.loadingPackages.length > 0) {
            const packageMessage = t("Papyros.loading", {
                // limit amount of package names shown
                packages: this.loadingPackages.slice(0, 3).join(", ")
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
}
