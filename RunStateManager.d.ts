import { ButtonOptions, RenderOptions } from "./util/Util";
interface DynamicButton {
    id: string;
    buttonHTML: string;
    onClick: () => void;
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
export declare class RunStateManager {
    /**
     * Current state of the program
     */
    state: RunState;
    /**
     * Buttons managed by this component
     */
    buttons: Array<DynamicButton>;
    /**
     * Construct a new RunStateManager with the given listeners
     * @param {function} onRunClicked Callback for when the run button is clicked
     * @param {function} onStopClicked Callback for when the stop button is clicked
     */
    constructor(onRunClicked: () => void, onStopClicked: () => void);
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
    showSpinner(show: boolean): void;
    /**
     * Show the current state of the program to the user
     * @param {RunState} state The current state of the run
     * @param {string} message Optional message to indicate the state
     */
    setState(state: RunState, message?: string): void;
    /**
     * Add a button to display to the user
     * @param {ButtonOptions} options Options for rendering the button
     * @param {function} onClick Listener for click events on the button
     */
    addButton(options: ButtonOptions, onClick: () => void): void;
    /**
 * Render the RunStateManager with the given options
 * @param {RenderOptions} options Options for rendering
 * @return {HTMLElement} The rendered RunStateManager
 */
    render(options: RenderOptions): HTMLElement;
}
export {};
