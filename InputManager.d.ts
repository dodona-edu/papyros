import { BackendEvent } from "./BackendEvent";
import { RenderOptions } from "./util/Util";
import { Channel } from "sync-message";
import { UserInputHandler } from "./input/UserInputHandler";
export declare enum InputMode {
    Interactive = "interactive",
    Batch = "batch",
    Debugging = "debugging"
}
export declare const INPUT_MODES: InputMode[];
export interface InputData {
    prompt: string;
    messageId: string;
}
export declare class InputManager {
    private previousInputMode;
    private _inputMode;
    private inputHandlers;
    private renderOptions;
    _waiting: boolean;
    prompt: string;
    onSend: () => void;
    channel: Channel;
    messageId: string;
    constructor(onSend: () => void);
    private buildInputHandlerMap;
    get inputMode(): InputMode;
    set inputMode(inputMode: InputMode);
    get inputHandler(): UserInputHandler;
    render(options: RenderOptions): void;
    set waiting(waiting: boolean);
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
