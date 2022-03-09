import { InputMode } from "../InputManager";
import { RenderOptions } from "../util/Util";
import { UserInputHandler } from "./UserInputHandler";
export declare class InteractiveInputHandler extends UserInputHandler {
    /**
     * HTML identifier for the used HTML button
     */
    private sendButtonId;
    /**
     * Construct a new InteractiveInputHandler
     * @param {function()} onInput  Callback for when the user has entered a value
     * @param {string} inputAreaId HTML identifier for the used HTML input field
     * @param {string} sendButtonId HTML identifier for the used HTML button
     */
    constructor(onInput: () => void, inputAreaId: string, sendButtonId: string);
    /**
     * Retrieve the button that users can click to send their input
     */
    get sendButton(): HTMLButtonElement;
    getInputMode(): InputMode;
    hasNext(): boolean;
    next(): string;
    waitWithPrompt(waiting: boolean, prompt?: string): void;
    onToggle(): void;
    onRunStart(): void;
    onRunEnd(): void;
    render(options: RenderOptions): HTMLElement;
}
