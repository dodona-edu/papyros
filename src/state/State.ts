import {State as LitState, stateProperty} from "@dodona/lit-state";


export enum SupportedLanguage {
    python = "python",
    javascript = "javascript",
}

export enum InputMode {
    batch = "batch",
    interactive = "interactive",
}

export enum RunState {
    Loading = "loading",
    Running = "running",
    AwaitingInput = "awaiting_input",
    Stopping = "stopping",
    Ready = "ready"
}

export class State extends LitState {
    @stateProperty
    public programmingLanguage: SupportedLanguage = SupportedLanguage.python;
    @stateProperty
    locale: string = "en";
    @stateProperty
    darkMode: boolean = false;

    @stateProperty
    debugMode: boolean = false;
    @stateProperty
    debugLine: number | null = null;

    @stateProperty
    inputMode: InputMode = InputMode.batch;
    @stateProperty
    stdin: string = "";
    @stateProperty
    stdout: string = "";
    @stateProperty
    prompt: string = "";

    @stateProperty
    status: RunState = RunState.Ready;

    @stateProperty
    code: string = "";
    @stateProperty
    testCode: string = "";

    @stateProperty
    files: Record<string, string> = {};
}

export const state = new State();
