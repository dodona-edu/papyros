import { InputManagerRenderOptions, InputMode } from "../InputManager";
import { Renderable } from "../util/Rendering";
/**
 * Base class for components that handle input from the user
 */
export declare abstract class UserInputHandler extends Renderable<InputManagerRenderOptions> {
    /**
     * Whether we are waiting for the user to input data
     */
    protected waiting: boolean;
    /**
     * Function to call when the user provided new input
     */
    protected inputCallback: () => void;
    /**
     * Construct a new UserInputHandler
     * @param {function()} inputCallback  Callback for when the user has entered a value
     */
    constructor(inputCallback: () => void);
    /**
     * Whether this handler has input ready
     */
    abstract hasNext(): boolean;
    /**
     * Consume and return the next input value
     *
     * Assumes hasNext() has been called and returned true,
     * otherwise behaviour can produce incorrect results
     * @return {string} The next value
     */
    abstract next(): string;
    /**
     * Method to call when a new run has started
     */
    abstract onRunStart(): void;
    /**
     * Method to call when the run ended
     */
    abstract onRunEnd(): void;
    /**
     * Retrieve the InputMode corresponding to this handler
     * @return {InputMode} The InputMode enum value
     */
    abstract getInputMode(): InputMode;
    /**
     * Enable or disable this UserInputHandler
     * @param {boolean} active Whether this component is active
     */
    abstract toggle(active: boolean): void;
    /**
     * @param {string} placeholder The placeholder to show
     */
    protected abstract setPlaceholder(placeholder: string): void;
    /**
     * Focus the area in which the user enters input
     */
    abstract focus(): void;
    /**
     * Wait for input of the user for a certain prompt
     * @param {boolean} waiting Whether we are waiting for input
     * @param {string} prompt Optional message to display if waiting
     */
    waitWithPrompt(waiting: boolean, prompt?: string): void;
    /**
     * Helper method to reset internal state
     */
    protected reset(): void;
}
