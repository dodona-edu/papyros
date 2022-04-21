import { BackendEvent } from "./BackendEvent";
import { UserInputHandler } from "./input/UserInputHandler";
import { Renderable, RenderOptions } from "./util/Rendering";
export declare enum InputMode {
    Interactive = "interactive",
    Batch = "batch"
}
export declare const INPUT_MODES: InputMode[];
export declare class InputManager extends Renderable {
    private inputMode;
    private inputHandlers;
    private waiting;
    private prompt;
    private sendInput;
    constructor(sendInput: (input: string) => void);
    private buildInputHandlerMap;
    getInputMode(): InputMode;
    setInputMode(inputMode: InputMode): void;
    get inputHandler(): UserInputHandler;
    _render(options: RenderOptions): void;
    waitWithPrompt(waiting: boolean, prompt?: string): void;
    onUserInput(): Promise<void>;
    /**
     * Asynchronously handle an input request by prompting the user for input
     * @param {BackendEvent} e Event containing the input data
     * @return {Promise<void>} Promise of handling the request
     */
    onInputRequest(e: BackendEvent): Promise<void>;
    onRunStart(): void;
    onRunEnd(): void;
}
