import { proxy, Remote } from "comlink";
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
    addListener, ButtonOptions, renderButton,
    RenderOptions, renderWithOptions, getElement,
    t
} from "./util/Util";

interface DynamicButton {
    id: string;
    buttonHTML: string;
    onClick: () => void;
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
export class CodeRunner {
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
    private backend: SyncClient<Backend>;
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
        this.programmingLanguage = programmingLanguage;
        this.editor = new CodeEditor();
        this.inputManager = new InputManager((input: string) => {
            this.backend.writeMessage(input);
            this.setState(RunState.Running);
        });
        this.backend = {} as SyncClient<Backend>;
        this.buttons = [];
        this.addButton({
            id: RUN_BTN_ID,
            buttonText: t("Papyros.run"),
            extraClasses: "text-white bg-blue-500"
        }, () => this.runCode());
        this.addButton({
            id: STOP_BTN_ID,
            buttonText: t("Papyros.stop"),
            extraClasses: "text-white bg-red-500"
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
        this.backend = BackendManager.startBackend(this.programmingLanguage);
        this.editor.setLanguage(this.programmingLanguage,
            async context => {
                const completionContext = Backend.convertCompletionContext(context);
                return await this.backend.workerProxy.autocomplete(completionContext);
            });
        // Allow passing messages between worker and main thread
        await (this.backend.workerProxy as Remote<Backend>)
            .launch(proxy((e: BackendEvent) => BackendManager.publish(e)));
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
        // Since we use workers, the old one must be entirely replaced to interrupt it
        this.backend.interrupt();
        return this.start();
    }

    /**
     * Set the used programming language to the given one to allow editing and running code
     * @param {ProgrammingLanguage} programmingLanguage The language to use
     */
    async setProgrammingLanguage(programmingLanguage: ProgrammingLanguage): Promise<void> {
        if (this.programmingLanguage !== programmingLanguage) { // Expensive, so ensure it is needed
            await this.backend.interrupt();
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

    /**
     * Render the RunStateManager with the given options
     * @param {RenderOptions} statusPanelOptions Options for rendering the panel
     * @param {RenderOptions} inputOptions Options for rendering the InputManager
     * @param {RenderOptions} codeEditorOptions Options for rendering the editor
     * @return {HTMLElement} The rendered RunStateManager
     */
    render(statusPanelOptions: RenderOptions,
        inputOptions: RenderOptions,
        codeEditorOptions: RenderOptions): HTMLElement {
        const rendered = renderWithOptions(statusPanelOptions, `
<div class="grid grid-cols-2 items-center">
    <div class="col-span-1 flex flex-row">
        ${this.buttons.map(b => b.buttonHTML).join("\n")}
    </div>
    <div class="col-span-1 flex flex-row-reverse">
        <div id="${APPLICATION_STATE_TEXT_ID}"></div>
        ${svgCircle(STATE_SPINNER_ID, "red")}
    </div>
</div>`);
        // Buttons are freshly added to the DOM, so attach listeners now
        this.buttons.forEach(b => addListener(b.id, b.onClick, "click"));
        this.inputManager.render(inputOptions);
        this.editor.render(codeEditorOptions, rendered);
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
        try {
            await this.backend.call(
                this.backend.workerProxy.runCode, this.editor.getCode()
            );
        } catch (error: any) {
            papyrosLog(LogType.Error, error);
            BackendManager.publish({
                type: BackendEventType.Error,
                data: JSON.stringify(error),
                contentType: "text/json"
            });
            endMessage = "Program terminated due to error: " + error.constructor.name;
        } finally {
            const end = new Date().getTime();
            this.setState(RunState.Ready, t("Papyros.finished", { time: (end - start) / 1000 }));
            BackendManager.publish({
                type: BackendEventType.End,
                data: endMessage, contentType: "text/plain"
            });
        }
    }
}