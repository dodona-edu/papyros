import { PapyrosEvent } from "./PapyrosEvent";
export declare enum InputMode {
    Interactive = "interactive",
    Batch = "batch"
}
export declare const INPUT_MODES: InputMode[];
interface InputSession {
    lineNr: number;
}
export declare class InputManager {
    inputWrapper: HTMLElement;
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
    buildInputArea(): void;
    setInputMode(inputMode: InputMode): void;
    setWaiting(waiting: boolean, prompt?: string): void;
    sendLine(): Promise<boolean>;
    onInput(e?: PapyrosEvent): Promise<void>;
    onRunStart(): void;
    onRunEnd(): void;
}
export {};
