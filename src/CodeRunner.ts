import { proxy } from "comlink";
import { SyncClient } from "comsync";
import { Backend } from "./Backend";
import { BackendEvent, BackendEventType } from "./BackendEvent";
import { BackendManager } from "./BackendManager";
import { CodeEditor } from "./CodeEditor";
import {
    APPLICATION_STATE_TEXT_ID, RUN_BTN_ID,
    STATE_SPINNER_ID, STOP_BTN_ID
} from "./Constants";
import { InputManager } from "./InputManager";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import { svgCircle } from "./util/HTMLShapes";
import { LogType, papyrosLog } from "./util/Logging";
import {
    addListener, getElement,
    t
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
    readonly editor: CodeEditor;
    /**
     * Component to request and handle input from the user
     */
    readonly inputManager: InputManager;
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
        }, () => this.runCode());
        this.addButton({
            id: STOP_BTN_ID,
            buttonText: t("Papyros.stop"),
            classNames: "_tw-text-white _tw-bg-red-500"
        }, () => this.stop());
        BackendManager.subscribe(BackendEventType.Input,
            () => this.setState(RunState.AwaitingInput));
        this.state = RunState.Ready;
    }

    /**
     * Start the backend to enable running code
     */
    async start(): Promise<void> {
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
                        const line = view.state.doc.line(d.lineNr);
                        const from = Math.min(line.from + d.columnNr, line.from);
                        return { ...d, from: from, to: from };
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
    async stop(): Promise<void> {
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
    async setProgrammingLanguage(programmingLanguage: ProgrammingLanguage): Promise<void> {
        if (this.programmingLanguage !== programmingLanguage) { // Expensive, so ensure it is needed
            await this.backend.then(b => b.interrupt());
            this.programmingLanguage = programmingLanguage;
            await this.start();
        }
    }

    getProgrammingLanguage(): ProgrammingLanguage {
        return this.programmingLanguage;
    }

    /**
     * Get the button to run the code
     */
    get runButton(): HTMLButtonElement {
        return getElement<HTMLButtonElement>(RUN_BTN_ID);
    }

    /**
     * Get the button to interrupt the code
     */
    get stopButton(): HTMLButtonElement {
        return getElement<HTMLButtonElement>(STOP_BTN_ID);
    }

    /**
     * Show or hide the spinning circle, representing a running animation
     * @param {boolean} show Whether to show the spinner
     */
    showSpinner(show: boolean): void {
        getElement(STATE_SPINNER_ID).style.display = show ? "" : "none";
    }

    /**
     * Show the current state of the program to the user
     * @param {RunState} state The current state of the run
     * @param {string} message Optional message to indicate the state
     */
    setState(state: RunState, message?: string): void {
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

    getState(): RunState {
        return this.state;
    }

    /**
     * Add a button to display to the user
     * @param {ButtonOptions} options Options for rendering the button
     * @param {function} onClick Listener for click events on the button
     */
    addButton(options: ButtonOptions, onClick: () => void): void {
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
    <div class="_tw-col-span-1 _tw-flex _tw-flex-row-reverse">
        <div id="${APPLICATION_STATE_TEXT_ID}"></div>
        ${svgCircle(STATE_SPINNER_ID, "red")}
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
     * Run the code that is currently present in the editor
     * @return {Promise<void>} Promise of running the code
     */
    async runCode(): Promise<void> {
        // Setup pre-run
        this.setState(RunState.Running);
        BackendManager.publish({
            type: BackendEventType.Start,
            data: "User started run", contentType: "text/plain"
        });
        papyrosLog(LogType.Debug, "Running code in Papyros, sending to backend");
        const start = new Date().getTime();
        let endMessage = "Program finishd normally";
        let terminated = false;
        try {
            await (this.backend).then(b => b.call(
                b.workerProxy.runCode, this.editor.getCode()
            ));
        } catch (error: any) {
            papyrosLog(LogType.Debug, "Error during code run", error);
            if (error.type === "InterruptError") {
                // Error signaling forceful interrupt
                terminated = true;
            }
            BackendManager.publish({
                type: BackendEventType.Error,
                data: JSON.stringify(error),
                contentType: "text/json"
            });
            endMessage = "Program terminated due to error: " + error.constructor.name;
        } finally {
            if (this.state !== RunState.Stopping) { // Was interrupted
                BackendManager.publish({
                    type: BackendEventType.End,
                    data: endMessage, contentType: "text/plain"
                });
            }
            const end = new Date().getTime();
            this.setState(RunState.Ready, t("Papyros.finished", { time: (end - start) / 1000 }));
            if (terminated) {
                await this.start();
            }
        }
    }
}
