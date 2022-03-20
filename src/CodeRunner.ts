import { proxy, Remote } from "comlink";
import { Backend } from "./Backend";
import { BackendEvent, BackendEventType } from "./BackendEvent";
import { BackendManager } from "./BackendManager";
import { CodeEditor } from "./CodeEditor";
import {
    APPLICATION_STATE_TEXT_ID, RUN_BTN_ID,
    STATE_SPINNER_ID, STOP_BTN_ID, DEBUG_BTN_ID
} from "./Constants";
import { InputManager, InputMode } from "./InputManager";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import { svgCircle } from "./util/HTMLShapes";
import { LogType, papyrosLog } from "./util/Logging";
import {
    addListener, ButtonOptions, renderButton,
    RenderOptions, renderWithOptions, getElement,
    t,
    parseData
} from "./util/Util";

interface DynamicButton {
    id: string;
    buttonHTML: string;
    onClick: () => void;
}

interface DebugAction {
    action: string;
    data: string;
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
    private backend: Remote<Backend>;
    /**
     * The identifier for the current run
     */
    private runId: number;
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
        this.inputManager = new InputManager(() => this.setState(RunState.Running));
        this.backend = {} as Remote<Backend>;
        this.runId = 0;
        this.buttons = [];
        this.addButton({
            id: RUN_BTN_ID,
            buttonText: t("Papyros.run"),
            extraClasses: "text-white bg-blue-500"
        }, () => this.runCode(false));
        this.addButton({
            id: STOP_BTN_ID,
            buttonText: t("Papyros.stop"),
            extraClasses: "text-white bg-red-500"
        }, () => this.stop());
        this.addButton({
            id: DEBUG_BTN_ID,
            buttonText: t("Papyros.debug"),
            extraClasses: "text-white bg-green-500"
        }, () => this.runCode(true));
        BackendManager.subscribe(BackendEventType.Input,
            () => this.setState(RunState.AwaitingInput));
        BackendManager.subscribe(BackendEventType.Debug,
            e => this.onDebug(e));
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
                return await this.backend.autocomplete(completionContext);
            });
        // Allow passing messages between worker and main thread
        await this.backend.launch(proxy(e => this.publishEvent(e)), this.inputManager.channel);
        this.editor.focus();
        this.setState(RunState.Ready);
    }

    /**
     * Interrupt the currently running code
     * @return {Promise<void>} Promise of stopping
     */
    async stop(): Promise<void> {
        this.runId += 1; // ignore messages coming from last run
        this.setState(RunState.Stopping);
        this.publishEvent({
            type: BackendEventType.End,
            runId: this.runId,
            data: "User cancelled run", contentType: "text/plain"
        });
        // Since we use workers, the old one must be entirely replaced to interrupt it
        BackendManager.stopBackend(this.backend);
        return this.start();
    }

    /**
     * Helper method to publish events, if they are still relevant
     * @param {BackendEvent} e The event to publish
     */
    publishEvent(e: BackendEvent): void {
        if (e.runId === this.runId) {
            BackendManager.publish(e);
        }
    }
    /**
     * Set the used programming language to the given one to allow editing and running code
     * @param {ProgrammingLanguage} programmingLanguage The language to use
     */
    async setProgrammingLanguage(programmingLanguage: ProgrammingLanguage): Promise<void> {
        if (this.programmingLanguage !== programmingLanguage) { // Expensive, so ensure it is needed
            BackendManager.stopBackend(this.backend);
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
     * Get the button to debug the code
     */
    get debugButton(): HTMLButtonElement {
        return getElement<HTMLButtonElement>(DEBUG_BTN_ID);
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
            this.debugButton.disabled = false;
        } else {
            this.showSpinner(true);
            this.runButton.disabled = true;
            this.debugButton.disabled = true;
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
     * @param {boolean} debug Whether the run happens in debug mode
     * @return {Promise<void>} Promise of running the code
     */
    async runCode(debug: boolean): Promise<void> {
        // Setup pre-run
        this.runId += 1;
        this.setState(RunState.Running);
        this.publishEvent({
            type: BackendEventType.Start,
            runId: this.runId,
            data: "User started run", contentType: "text/plain"
        });
        papyrosLog(LogType.Debug, "Running code in Papyros, sending to backend");
        const start = new Date().getTime();
        let endMessage = "Program finishd normally";
        try {
            if (debug) {
                this.inputManager.inputMode = InputMode.Debugging;
                await this.backend.debugCode(
                    this.editor.getCode(), this.runId, this.editor.breakpointLines);
            } else {
                await this.backend.runCode(this.editor.getCode(), this.runId);
            }
        } catch (error: any) {
            papyrosLog(LogType.Error, error);
            this.publishEvent({
                type: BackendEventType.Error,
                data: JSON.stringify(error),
                runId: this.runId,
                contentType: "text/json"
            });
            endMessage = "Program terminated due to error: " + error.constructor.name;
        } finally {
            const end = new Date().getTime();
            this.setState(RunState.Ready, t("Papyros.finished", { time: (end - start) / 1000 }));
            this.publishEvent({
                type: BackendEventType.End,
                runId: this.runId,
                data: endMessage, contentType: "text/plain"
            });
        }
    }

    onDebug(e: BackendEvent): void {
        const data: DebugAction = parseData(e.data, e.contentType);
        if (data.action === "highlight") {
            this.editor.highlight(parseInt(data.data));
        } else if (data.action === "print") {
            if (!data.data.endsWith("\n")) {
                data.data += "\n";
            }
            this.publishEvent({
                type: BackendEventType.Output,
                runId: this.runId,
                data: data.data,
                contentType: "text/plain"
            });
        }
    }
}
