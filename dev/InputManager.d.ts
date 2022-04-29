import { BackendEvent } from "./BackendEvent";
import { RenderOptions } from "./util/Util";
import { UserInputHandler } from "./input/UserInputHandler";
export declare enum InputMode {
    Interactive = "interactive",
    Batch = "batch"
}
export declare const INPUT_MODES: InputMode[];
export declare class InputManager {
    private inputMode;
    private inputHandlers;
    private renderOptions;
    private waiting;
    private prompt;
    private sendInput;
    constructor(sendInput: (input: string) => void);
    private buildInputHandlerMap;
    getInputMode(): InputMode;
    setInputMode(inputMode: InputMode): void;
    get inputHandler(): UserInputHandler;
    render(options: RenderOptions): void;
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
