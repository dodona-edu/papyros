import { InputMode } from "../InputManager";
import { RenderOptions } from "../util/Util";
export interface InputListener {
    onUserInput(): void;
}
/**
 * Base class for components that handle input from the user
 */
export declare abstract class UserInputHandler {
    /**
     * Whether we are waiting for the user to input data
     */
    protected waiting: boolean;
    protected inputListeners: Set<InputListener>;
    /**
     * Construct a new UserInputHandler
     */
    constructor();
    addInputListener(listener: InputListener): void;
    protected onUserInput(): void;
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
     * Render this UserInputHandler with the given options
     * @param {RenderOptions} options The options to use while rendering
     * @return {HTMLElement} The parent with the new content
     */
    abstract render(options: RenderOptions): HTMLElement;
    abstract onRunStart(): void;
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
    abstract onToggle(active: boolean): void;
    /**
     * Retrieve the HTMLInputElement for this InputHandler
     */
    get inputArea(): HTMLInputElement;
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
