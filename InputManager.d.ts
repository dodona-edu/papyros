import { PapyrosEvent } from "./PapyrosEvent";
import { RenderOptions } from "./util/Util";
import { Channel } from "sync-message";
import { UserInputHandler } from "./input/UserInputHandler";
import { RunListener } from "./RunListener";
export declare enum InputMode {
    Interactive = "interactive",
    Batch = "batch"
}
export declare const INPUT_MODES: InputMode[];
export interface InputData {
    prompt: string;
    messageId: string;
}
export declare class InputManager implements RunListener {
    private _inputMode;
    private inputHandlers;
    private renderOptions;
    _waiting: boolean;
    prompt: string;
    onSend: () => void;
    channel: Channel;
    messageId: string;
    constructor(onSend: () => void, inputMode: InputMode);
    private buildInputHandlerMap;
    get inputMode(): InputMode;
    set inputMode(inputMode: InputMode);
    get inputHandler(): UserInputHandler;
    render(options: RenderOptions): void;
    set waiting(waiting: boolean);
    sendLine(): Promise<void>;
    /**
     * Asynchronously handle an input request by prompting the user for input
     * @param {PapyrosEvent} e Event containing the input data
     * @return {Promise<void>} Promise of handling the request
     */
    onInput(e: PapyrosEvent): Promise<void>;
    onRunStart(): void;
    onRunEnd(): void;
}
