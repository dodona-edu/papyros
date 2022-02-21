import { PapyrosEvent } from "./PapyrosEvent";
import { RenderOptions } from "./util/Util";
export declare enum InputMode {
    Interactive = "interactive",
    Batch = "batch"
}
export declare const INPUT_MODES: InputMode[];
interface InputSession {
    lineNr: number;
}
export declare class InputManager {
    renderOptions: RenderOptions;
    inputMode: InputMode;
    waiting: boolean;
    batchInput: string;
    onSend: () => void;
    session: InputSession;
    inputTextArray?: Uint8Array;
    inputMetaData?: Int32Array;
    textEncoder: TextEncoder;
    constructor(onSend: () => void, inputMode: InputMode);
    get enterButton(): HTMLButtonElement;
    get inputArea(): HTMLInputElement;
    render(options?: RenderOptions): void;
    setInputMode(inputMode: InputMode): void;
    setWaiting(waiting: boolean, prompt?: string): void;
    sendLine(): Promise<boolean>;
    onInput(e?: PapyrosEvent): Promise<void>;
    onRunStart(): void;
    onRunEnd(): void;
}
export {};
