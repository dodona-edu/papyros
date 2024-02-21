import { InputMode } from "../InputManager";
import { UserInputHandler } from "./UserInputHandler";
import { RenderOptions } from "../util/Rendering";
/**
 * Input handler that takes input from the user in an interactive fashion
 */
export declare class InteractiveInputHandler extends UserInputHandler {
    /**
     * Retrieve the button that users can click to send their input
     */
    private get sendButton();
    /**
     * Retrieve the HTMLInputElement for this InputHandler
     */
    private get inputArea();
    getInputMode(): InputMode;
    hasNext(): boolean;
    next(): string;
    waitWithPrompt(waiting: boolean, prompt?: string): void;
    protected setPlaceholder(placeholder: string): void;
    focus(): void;
    toggle(): void;
    onRunStart(): void;
    onRunEnd(): void;
    protected _render(options: RenderOptions): void;
    reset(): void;
}
