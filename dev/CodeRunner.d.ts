import { CodeEditor } from "./CodeEditor";
import { InputManager } from "./InputManager";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import { RenderOptions, ButtonOptions, Renderable } from "./util/Rendering";
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
export declare class CodeRunner extends Renderable<CodeRunnerRenderOptions> {
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
     * Get the button to interrupt the code
     */
    get stopButton(): HTMLButtonElement;
    /**
     * Show or hide the spinning circle, representing a running animation
     * @param {boolean} show Whether to show the spinner
     */
    private showSpinner;
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
    protected _render(options: CodeRunnerRenderOptions): HTMLElement;
    /**
     * @param {string} code The code to run
     * @return {Promise<void>} Promise of running the code
     */
    runCode(code: string): Promise<void>;
}
export {};