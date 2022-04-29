import { InputMode } from "../InputManager";
import { RenderOptions } from "../util/Util";
import { UserInputHandler } from "./UserInputHandler";
/**
 * Input handler that takes input from the user in an interactive fashion
 */
export declare class InteractiveInputHandler extends UserInputHandler {
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
