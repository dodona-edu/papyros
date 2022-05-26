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
    constructor(sendInput: (input: string) => void, inputMode: InputMode);
    private buildInputHandlerMap;
    getInputMode(): InputMode;
    setInputMode(inputMode: InputMode): void;
    private get inputHandler();
    isWaiting(): boolean;
    protected _render(options: RenderOptions): void;
    private waitWithPrompt;
    private onUserInput;
    /**
     * Asynchronously handle an input request by prompting the user for input
     * @param {BackendEvent} e Event containing the input data
     * @return {Promise<void>} Promise of handling the request
     */
    private onInputRequest;
    private onRunStart;
    private onRunEnd;
}
