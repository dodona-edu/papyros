import { INPUT_TA_ID } from "../Constants";
import { InputMode } from "../InputManager";
import { t, getElement } from "../util/Util";
import { Renderable } from "../util/Rendering";

/**
 * Base class for components that handle input from the user
 */
export abstract class UserInputHandler extends Renderable {
    /**
     * Whether we are waiting for the user to input data
     */
    protected waiting: boolean;

    protected inputCallback: () => void;

    /**
     * Construct a new UserInputHandler
     * @param {function()} inputCallback  Callback for when the user has entered a value
     */
    constructor(inputCallback: () => void) {
        super();
        this.waiting = false;
        this.inputCallback = inputCallback;
    }

    /**
     * Whether this handler has input ready
     */
    public abstract hasNext(): boolean;
    /**
     * Consume and return the next input value
     *
     * Assumes hasNext() has been called and returned true,
     * otherwise behaviour can produce incorrect results
     * @return {string} The next value
     */
    public abstract next(): string;

    /**
     * Method to call when a new run has started
     */
    public abstract onRunStart(): void;

    /**
     * Method to call when the run ended
     */
    public abstract onRunEnd(): void;
    /**
     * Retrieve the InputMode corresponding to this handler
     * @return {InputMode} The InputMode enum value
     */
    public abstract getInputMode(): InputMode;
    /**
     * Enable or disable this UserInputHandler
     * @param {boolean} active Whether this component is active
     */
    public abstract toggle(active: boolean): void;

    /**
     * Retrieve the HTMLInputElement for this InputHandler
     */
    public get inputArea(): HTMLInputElement {
        return getElement<HTMLInputElement>(INPUT_TA_ID);
    }

    /**
     * Wait for input of the user for a certain prompt
     * @param {boolean} waiting Whether we are waiting for input
     * @param {string} prompt Optional message to display if waiting
     */
    public waitWithPrompt(waiting: boolean, prompt = ""): void {
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
     * Helper method to reset internal state
     */
    protected reset(): void {
        this.inputArea.value = "";
    }
}