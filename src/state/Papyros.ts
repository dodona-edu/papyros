import {State, stateProperty} from "@dodona/lit-state";
import {Debugger} from "./Debugger";
import {Runner} from "./Runner";
import {InputOutput} from "./InputOutput";
import {Theme} from "./Theme";

export enum InputMode {
    batch = "batch",
    interactive = "interactive",
}

export class Papyros extends State {
    readonly debugger: Debugger = new Debugger();
    readonly runner: Runner = new Runner(this);
    readonly io: InputOutput = new InputOutput();
    readonly theme: Theme = new Theme();


    @stateProperty
    locale: string = "en";
    @stateProperty
    darkMode: boolean = false;

    @stateProperty
    files: Record<string, string> = {};
}

export const papyros = new Papyros();
