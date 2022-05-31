import { UserInputHandler } from "./input/UserInputHandler";
import { Renderable, RenderOptions } from "./util/Rendering";
import { EditorStyling } from "./editor/CodeMirrorEditor";
export declare enum InputMode {
    Interactive = "interactive",
    Batch = "batch"
}
export declare const INPUT_MODES: InputMode[];
export interface InputManagerRenderOptions extends RenderOptions {
    /**
     * Option to allow styling the editor area of the input handler
     */
    inputStyling?: Partial<EditorStyling>;
}
export declare class InputManager extends Renderable<InputManagerRenderOptions> {
    private inputMode;
    private inputHandlers;
    private waiting;
    private prompt;
    private sendInput;
    constructor(sendInput: (input: string) => void, inputMode: InputMode);
    private buildInputHandlerMap;
    getInputMode(): InputMode;
    setInputMode(inputMode: InputMode): void;
    get inputHandler(): UserInputHandler;
    isWaiting(): boolean;
    protected _render(options: InputManagerRenderOptions): void;
    private waitWithPrompt;
    private onUserInput;
    /**
     * Asynchronously handle an input request by prompting the user for input
     * @param {BackendEvent} e Event containing the input data
     */
    private onInputRequest;
    private onRunStart;
    private onRunEnd;
}
