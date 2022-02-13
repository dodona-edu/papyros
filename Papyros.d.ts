import "./Papyros.css";
import { Remote } from "comlink";
import { Backend } from "./Backend";
import { CodeEditor } from "./CodeEditor";
import { InputManager, InputMode } from "./InputManager";
import { PapyrosEvent } from "./PapyrosEvent";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import { StatusPanel } from "./StatusPanel";
import { OutputManager } from "./OutputManager";
declare enum PapyrosState {
    Loading = "loading",
    Running = "running",
    AwaitingInput = "awaiting_input",
    Stopping = "stopping",
    Ready = "ready"
}
declare class PapyrosStateManager {
    state: PapyrosState;
    statusPanel: StatusPanel;
    runButton: HTMLButtonElement;
    stopButton: HTMLButtonElement;
    constructor(statusPanel: StatusPanel);
    setState(state: PapyrosState, message?: string): void;
}
interface PapyrosCodeState {
    programmingLanguage: ProgrammingLanguage;
    editor: CodeEditor;
    backend: Remote<Backend>;
    runId: number;
    outputArea: HTMLInputElement;
}
interface PapyrosConfig {
    standAlone: boolean;
    programmingLanguage: ProgrammingLanguage;
    locale: string;
    inputMode: InputMode;
}
export declare class Papyros {
    stateManager: PapyrosStateManager;
    codeState: PapyrosCodeState;
    inputManager: InputManager;
    outputManager: OutputManager;
    constructor(programmingLanguage: ProgrammingLanguage, inputMode: InputMode);
    get state(): PapyrosState;
    launch(): Promise<Papyros>;
    setProgrammingLanguage(programmingLanguage: ProgrammingLanguage): Promise<void>;
    setCode(code: string): void;
    startBackend(): Promise<void>;
    static fromElement(parent: HTMLElement, config: PapyrosConfig): Papyros;
    static configureInput(allowReload: boolean): Promise<boolean>;
    onError(e: PapyrosEvent): void;
    onInput(e: PapyrosEvent): Promise<void>;
    onMessage(e: PapyrosEvent): void;
    runCode(): Promise<void>;
    stop(): Promise<void>;
}
export {};
