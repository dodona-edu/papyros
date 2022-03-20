import { BackendEvent } from "./BackendEvent";
import { CodeEditor } from "./CodeEditor";
import { InputManager } from "./InputManager";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import { ButtonOptions, RenderOptions } from "./util/Util";
/**
 * Enum representing the possible states while processing code
 */
export declare enum RunState {
    Loading = "loading",
    Running = "running",
    AwaitingInput = "awaiting_input",
    Stopping = "stopping",
    Ready = "ready"
}
/**
 * Helper component to manage and visualize the current RunState
 */
export declare class CodeRunner {
    /**
     * The currently used programming language
     */
    private programmingLanguage;
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
    private backend;
    /**
     * The identifier for the current run
     */
    private runId;
    /**
     * Current state of the program
     */
    private state;
    /**
     * Buttons managed by this component
     */
    private buttons;
    /**
     * Construct a new RunStateManager with the given listeners
     * @param {ProgrammingLanguage} programmingLanguage The language to use
     */
    constructor(programmingLanguage: ProgrammingLanguage);
    /**
     * Start the backend to enable running code
     */
    start(): Promise<void>;
    /**
     * Interrupt the currently running code
     * @return {Promise<void>} Promise of stopping
     */
    stop(): Promise<void>;
    /**
     * Helper method to publish events, if they are still relevant
     * @param {BackendEvent} e The event to publish
     */
    publishEvent(e: BackendEvent): void;
    /**
     * Set the used programming language to the given one to allow editing and running code
     * @param {ProgrammingLanguage} programmingLanguage The language to use
     */
    setProgrammingLanguage(programmingLanguage: ProgrammingLanguage): Promise<void>;
    getProgrammingLanguage(): ProgrammingLanguage;
    /**
     * Get the button to run the code
     */
    get runButton(): HTMLButtonElement;
    /**
     * Get the button to debug the code
     */
    get debugButton(): HTMLButtonElement;
    /**
     * Get the button to interrupt the code
     */
    get stopButton(): HTMLButtonElement;
    /**
     * Show or hide the spinning circle, representing a running animation
     * @param {boolean} show Whether to show the spinner
     */
    showSpinner(show: boolean): void;
    /**
     * Show the current state of the program to the user
     * @param {RunState} state The current state of the run
     * @param {string} message Optional message to indicate the state
     */
    setState(state: RunState, message?: string): void;
    getState(): RunState;
    /**
     * Add a button to display to the user
     * @param {ButtonOptions} options Options for rendering the button
     * @param {function} onClick Listener for click events on the button
     */
    addButton(options: ButtonOptions, onClick: () => void): void;
    /**
     * Render the RunStateManager with the given options
     * @param {RenderOptions} statusPanelOptions Options for rendering the panel
     * @param {RenderOptions} inputOptions Options for rendering the InputManager
     * @param {RenderOptions} codeEditorOptions Options for rendering the editor
     * @return {HTMLElement} The rendered RunStateManager
     */
    render(statusPanelOptions: RenderOptions, inputOptions: RenderOptions, codeEditorOptions: RenderOptions): HTMLElement;
    /**
     * Run the code that is currently present in the editor
     * @param {boolean} debug Whether the run happens in debug mode
     * @return {Promise<void>} Promise of running the code
     */
    runCode(debug: boolean): Promise<void>;
    onDebug(e: BackendEvent): void;
}
