import { InputMode } from "../InputManager";
import { RunListener } from "../RunListener";
import { getElement, RenderOptions, t } from "../util/Util";

/**
 * Base class for components that handle input from the user
 */
export abstract class UserInputHandler implements RunListener {
    /**
     * Whether we are waiting for the user to input data
     */
    protected waiting: boolean;
    /**
     * Callback for when the user has entered a value
     */
    protected onInput: () => void;
    /**
     * HTML identifier for the used HTML input field
     */
    protected inputAreaId: string;

    /**
     * Construct a new UserInputHandler
     * @param {function()} onInput  Callback for when the user has entered a value
     * @param {string} inputAreaId HTML identifier for the used HTML input field
     */
    constructor(onInput: () => void, inputAreaId: string) {
        this.waiting = false;
        this.onInput = onInput;
        this.inputAreaId = inputAreaId;
    }
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
    get inputArea(): HTMLInputElement {
        return getElement<HTMLInputElement>(this.inputAreaId);
    }

    /**
     * Set the waiting state of the input handler with a message
     * @param {boolean} waiting Whether we are waiting for input
     * @param {string} prompt Optional message to display if waiting
     */
    setWaiting(waiting: boolean, prompt = ""): void {
        this.waiting = waiting;
        this.inputArea.setAttribute("placeholder",
            prompt || t(`Papyros.input_placeholder.${this.getInputMode()}`));
        if (waiting) {
            // Focusing is a rendering operation
            // Subclasses can execute code after this operation, skipping the rendering
            // Using setTimeout ensures rendering will be done when the main thread has time
            // eslint-disable-next-line max-len
            // More info here: https://stackoverflow.com/questions/1096436/document-getelementbyidid-focus-is-not-working-for-firefox-or-chrome
            setTimeout(() => this.inputArea.focus(), 0);
        }
    }

    /**
     * Helper method to reset internal state when needed
     */
    protected reset(): void {
        this.inputArea.value = "";
    }
}
