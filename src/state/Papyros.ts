import {State, stateProperty} from "@dodona/lit-state";
import {Debugger} from "./Debugger";
import {Runner} from "./Runner";
import {InputOutput} from "./InputOutput";
import {Theme} from "./Theme";
import {Constants} from "./Constants";

export class Papyros extends State {
    readonly debugger: Debugger = new Debugger(this);
    readonly runner: Runner = new Runner(this);
    readonly io: InputOutput = new InputOutput(this);
    readonly theme: Theme = new Theme();
    readonly constants: Constants = new Constants();

    @stateProperty
    locale: string = "en";
    @stateProperty
    darkMode: boolean = false;

    @stateProperty
    files: Record<string, string> = {};
}

export const papyros = new Papyros();
