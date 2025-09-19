import {State as LitState, stateProperty} from "@dodona/lit-state";
import {Frame} from "@dodona/trace-component/dist/trace_types";
import {Debugger} from "./Debugger";


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
    debugger: Debugger = new Debugger();

    @stateProperty
    public programmingLanguage: SupportedLanguage = SupportedLanguage.python;
    @stateProperty
    locale: string = "en";
    @stateProperty
    darkMode: boolean = false;

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
